import { Radio } from "@heroui/radio";
import { Chip } from "@heroui/chip";
import { InfoCircle } from "@mynaui/icons-react";
import { Tooltip } from "@heroui/tooltip";

const cn = (...classNames: (string | undefined | null | false)[]) => {
  return classNames.filter(Boolean).join(" ");
};

const methodConfig = {
  GET: {
    color: "success" as const,
    baseClass: "bg-[#192c2c]",
  },
  POST: {
    color: "warning" as const,
    baseClass: "bg-[#332323]",
  },
  WS: {
    color: "secondary" as const,
    baseClass: "bg-[#26223d]",
  },
};

export const ApiListItem = (props: any) => {
  const { children, ...otherProps } = props;

  const currentMethodConfig =
    methodConfig[props.method as keyof typeof methodConfig] ||
    methodConfig.POST;

  return (
    <Radio
      {...otherProps}
      classNames={{
        base: cn(
          "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between",
          "flex-row max-w-none w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent",
          "data-[selected=true]:border-primary transition-all duration-150",
        ),
        wrapper: "hidden",
        labelWrapper: "w-full",
      }}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <Chip
            className="px-2"
            classNames={{
              base: currentMethodConfig.baseClass,
            }}
            color={currentMethodConfig.color}
            radius="sm"
            size="sm"
            variant="bordered"
          >
            {props.method}
          </Chip>
          <div className="flex flex-col">
            <span className="font-jetbrains text-sm">{props.path}</span>
            <span className="flex items-center text-sm text-default-500">
              {props.desc}
              {props.info && (
                <Tooltip
                  className="px-3"
                  closeDelay={200}
                  color="foreground"
                  content={props.info}
                  delay={200}
                  offset={10}
                  placement="bottom"
                >
                  <InfoCircle className="ml-1 z-[2]" size={16} />
                </Tooltip>
              )}
            </span>
          </div>
        </div>
        <div>
          <Chip className="px-1">{props.tag}</Chip>
        </div>
      </div>
      {children}
    </Radio>
  );
};
