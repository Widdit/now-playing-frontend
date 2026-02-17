import { ReactThreeFiber } from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ReactThreeFiber.Object3DNode<
      MeshLineGeometry,
      typeof MeshLineGeometry
    >;
    meshLineMaterial: ReactThreeFiber.MaterialNode<
      MeshLineMaterial,
      typeof MeshLineMaterial
    >;
  }
}
