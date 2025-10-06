// TODO: update this to match the actual landmarks index in mediapipe
export enum PoseLandmark {
  LEFT_SHOULDER = 0,
  RIGHT_SHOULDER = 1,
  LEFT_ELBOW = 2,
  RIGHT_ELBOW = 3,
  LEFT_WRIST = 4,
  RIGHT_WRIST = 5,
}

export const LIMB_CONNECTIONS: [PoseLandmark, PoseLandmark][] = [
  [PoseLandmark.LEFT_SHOULDER, PoseLandmark.LEFT_ELBOW],
  [PoseLandmark.LEFT_ELBOW, PoseLandmark.LEFT_WRIST],
  [PoseLandmark.RIGHT_SHOULDER, PoseLandmark.RIGHT_ELBOW],
  [PoseLandmark.RIGHT_ELBOW, PoseLandmark.RIGHT_WRIST],
];

// Using mediapipe, which returns landmarks as (x,y) tuples
export interface FrameData {
  id: string;
  landmarks: Array<[number, number]>;
  angles: Array<number>;
  frameNumber: number;
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function calculateLimbAngles(
  frameLandmarks: Array<[number, number]>
): Array<number> {
  const frameAngles: Array<number> = [];

  const limbAngles: Array<number> = [];

  for (const [start, end] of LIMB_CONNECTIONS) {
    try {
      const startPoint = frameLandmarks[start];
      const endPoint = frameLandmarks[end];
      if (!startPoint || !endPoint) throw new Error();


      const dx = endPoint[0] - startPoint[0];
      const dy = endPoint[1] - startPoint[1];
      const angle = Math.atan2(dx, dy);

      const normalizedAngle = angle < 0 ? 2 * Math.PI + angle : angle;
      const finalAngle =
        normalizedAngle > Math.PI
          ? 2 * Math.PI - normalizedAngle
          : normalizedAngle;

      limbAngles.push(toDegrees(finalAngle));
    } catch {
      limbAngles.push(NaN);
    }
  }

  frameAngles.push(...limbAngles);

  console.log("Calculated angles for frames:", frameAngles);
  return frameAngles;
}
