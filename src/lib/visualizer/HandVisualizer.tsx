import React, { useEffect, useRef, useContext } from "react";

import HandPoseContext from "../HandPoseContext";
import { drawHands } from "./drawHands";

export type Props = {
  sourceSize: number;
};

export const HandVisualizer = ({ sourceSize }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { hands } = useContext(HandPoseContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawHands(hands, ctx);
      }
    }
  }, [hands, sourceSize]);

  return (
    <canvas
      style={{ border: "1px solid black", width: "100%" }}
      ref={canvasRef}
      width={sourceSize}
      height={sourceSize}
    />
  );
};
