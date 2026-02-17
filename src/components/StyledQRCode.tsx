// StyledQRCode.tsx
import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling, { Options as QRCodeOptions } from "qr-code-styling";

export interface StyledQRCodeProps {
  /** 二维码数据 URL */
  url: string;
  /** 目标尺寸（像素） */
  targetSize?: number;
  /** QRCodeStyling 配置选项，用于覆盖默认样式 */
  qrCodeStyling?: Partial<Omit<QRCodeOptions, "data" | "width" | "height">>;
  /** 容器 className */
  className?: string;
}

// SVG 渲染的圆角二维码组件
const StyledQRCode: React.FC<StyledQRCodeProps> = ({
                                                     url,
                                                     targetSize = 172,
                                                     qrCodeStyling,
                                                     className = "flex justify-center items-center",
                                                   }) => {
  const ref = useRef<HTMLDivElement>(null);
  const lastObjectUrlRef = useRef<string | null>(null);
  const renderIdRef = useRef(0);
  const [imgSrc, setImgSrc] = useState<string>("");

  const [qrCode] = useState<QRCodeStyling>(() => {
    const defaultOptions: QRCodeOptions = {
      width: targetSize,
      height: targetSize,
      type: "canvas",
      data: url,
      image: "/assets/icon-192x192.png",
      margin: 0,
      dotsOptions: {
        color: "#121212",
        type: "rounded", // 圆形点阵
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      imageOptions: {
        crossOrigin: "anonymous",
      },
      cornersSquareOptions: {
        type: "extra-rounded", // 定位点外框圆角
        color: "#121212",
      },
      cornersDotOptions: {
        type: "dot", // 定位点中心圆点
        color: "#121212",
      },
    };

    return new QRCodeStyling({
      ...defaultOptions,
      ...qrCodeStyling,
      type: "canvas",
      data: url,
      width: targetSize,
      height: targetSize,
    });
  });

  useEffect(() => {
    return () => {
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const currentRenderId = ++renderIdRef.current;

    const raf = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const generate = async () => {
      // 1) 不直接展示 SVG（SVG 在部分浏览器/缩放情况下容易出现栅格缝）
      // 2) 使用 canvas 生成高分辨率 PNG，并强制内部尺寸对齐到「模块数 * 整数像素」
      // 3) 最终展示 PNG，彻底规避 SVG 抗锯齿导致的“白色细线/栅格缝”
      const dpr =
        typeof window !== "undefined" && window.devicePixelRatio
          ? window.devicePixelRatio
          : 1;

      // 先让库完成一次编码，确保内部 _qr 可用
      qrCode.update({
        ...(qrCodeStyling ?? {}),
        type: "canvas",
        data: url,
        width: targetSize,
        height: targetSize,
        margin: 0,
      });

      // 等待内部状态就绪（包含图片加载/绘制调度）
      await raf();

      let moduleCount: number | null = null;
      for (let i = 0; i < 8; i++) {
        const internalQr = (qrCode as any)?._qr;
        const count =
          typeof internalQr?.getModuleCount === "function"
            ? (internalQr.getModuleCount() as number)
            : null;

        if (count && Number.isFinite(count)) {
          moduleCount = count;
          break;
        }
        await raf();
      }

      // 使用较高的内部渲染尺寸，确保圆角边缘更平滑
      const oversample = 6;
      const desiredRenderSize = Math.max(
        targetSize,
        Math.round(targetSize * oversample * dpr)
      );

      // 将内部像素尺寸对齐到「模块数 * 整数像素」，从根源上避免子像素绘制造成的缝隙
      let renderSize = desiredRenderSize;
      if (moduleCount) {
        const moduleSize = Math.max(1, Math.round(desiredRenderSize / moduleCount));
        renderSize = moduleCount * moduleSize;
      }

      qrCode.update({
        ...(qrCodeStyling ?? {}),
        type: "canvas",
        data: url,
        width: renderSize,
        height: renderSize,
        margin: 0,
      });

      const rawData = await qrCode.getRawData("png");

      if (renderIdRef.current !== currentRenderId) return;
      if (!rawData) return;

      let pngBlob: Blob;

      if (rawData instanceof Blob) {
        pngBlob = rawData;
      } else {
        // Buffer 在 TS 类型上可能是 Buffer<ArrayBufferLike>，但运行时它本质上是 Uint8Array
        const view = rawData as unknown as Uint8Array;

        // 拷贝到新的 Uint8Array，确保底层是标准 ArrayBuffer（避免 SharedArrayBuffer 类型不兼容）
        const copy = new Uint8Array(view.byteLength);
        copy.set(view);

        pngBlob = new Blob([copy.buffer], { type: "image/png" });
      }

      const objectUrl = URL.createObjectURL(pngBlob);

      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
      }
      lastObjectUrlRef.current = objectUrl;
      setImgSrc(objectUrl);
    };

    generate();

    return () => {
      // 仅通过 renderIdRef 让旧任务失效；objectUrl 在新结果生成后/卸载时统一回收
    };
  }, [url, targetSize, qrCode, qrCodeStyling]);

  return (
    <div ref={ref} className={className}>
      {imgSrc ? (
        <img
          alt="QR Code"
          height={targetSize}
          src={imgSrc}
          style={{ display: "block", width: targetSize, height: targetSize }}
          width={targetSize}
        />
      ) : null}
    </div>
  );
};

export default StyledQRCode;
