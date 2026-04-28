"use client";

import { useRobotStore } from "@/lib/store";
import { RobotViewer } from "./robot-viewer";
import { Puma560Model } from "./puma560-model";
import { JointSliders } from "./joint-sliders";
import { PoseDisplay } from "./pose-display";

type Props = {
  height?: number;
  showWristCenter?: boolean;
};

export function Puma560Playground({ height = 480, showWristCenter = false }: Props) {
  const { joints } = useRobotStore();
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <RobotViewer height={height}>
        <Puma560Model joints={joints} showWristCenter={showWristCenter} />
      </RobotViewer>
      <div className="space-y-4">
        <JointSliders />
        <PoseDisplay />
      </div>
    </div>
  );
}
