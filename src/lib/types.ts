export type Matrix4 = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
];

export type Matrix3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

export type Vec3 = readonly [number, number, number];

export type JointConfig = readonly [number, number, number, number, number, number];

export type Pose = {
  position: Vec3;
  rpy: Vec3;
};

export type DHConvention = "standard" | "modified";

export type DHParameter = {
  alpha: number;
  a: number;
  d: number;
  theta: number;
  jointType: "revolute" | "prismatic";
  jointOffset?: number;
  limits?: { min: number; max: number };
};

export type RobotModel = {
  id: string;
  name: string;
  convention: DHConvention;
  dh: readonly DHParameter[];
  baseOffset?: Matrix4;
  toolOffset?: Matrix4;
  home: JointConfig;
};

export type IKSolution = {
  joints: JointConfig;
  branch?: IKBranch;
  success: boolean;
  residual?: number;
  iterations?: number;
  timeMs?: number;
};

export type IKBranch = {
  shoulder: "left" | "right";
  elbow: "up" | "down";
  wrist: "flip" | "noflip";
};

export type IKSolver = {
  id: string;
  name: string;
  category: "analytical" | "jacobian" | "optimization" | "neural" | "hybrid";
  solve: (robot: RobotModel, target: Pose, seed?: JointConfig) => IKSolution | IKSolution[];
};
