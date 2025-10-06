/**
 * Feedback Test Cases
 *
 * Demonstrates both manual feedback generation and AI-assisted feedback generation
 */

import { Feedback } from "./feedback";
import { GeminiLLM, Config } from "./gemini-llm";
import { calculateLimbAngles, FrameData, PoseLandmark } from "./frameData";

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
  try {
    const config = require("../config.json");
    return config;
  } catch (error) {
    console.error(
      "❌ Error loading config.json. Please ensure it exists with your API key."
    );
    console.error("Error details:", (error as Error).message);
    process.exit(1);
  }
}

/**
 * Create mock Mediapipe-style landmarks for a single frame
 * (indexed by PoseLandmark, containing [x, y] coordinates)
 */
function adjustLandmarks(
  originalLandmarks: Array<[number, number]>,
  changes: Array<[number, number]>
): Array<[number, number]> {
  // Go through enum once — only numeric indices
  const landmarkIndices = Object.values(PoseLandmark).filter(
    (v) => typeof v === "number"
  ) as number[];

  for (const idx of landmarkIndices) {
    if (idx < originalLandmarks.length && idx < changes.length) {
      originalLandmarks[idx][0] += changes[idx][0];
      originalLandmarks[idx][1] += changes[idx][1];
    } else {
      console.error(`Missing landmark at index: ${idx}`);
    }
  }
  return originalLandmarks;
}

/**
 * Test case: Perfect poses (no correction expected)
 */
export async function testPerfectPoses(): Promise<void> {
  console.log("\n🧪 TEST CASE: Perfect poses");
  console.log("=====================================");

  const feedbackSystem = new Feedback();
  const config = loadConfig();
  const llm = new GeminiLLM(config);

  console.log("🎥 Creating mock pose data...");
  const refLandmarks: Array<[number, number]> = [];
  refLandmarks[PoseLandmark.LEFT_SHOULDER] = [2, 4];
  refLandmarks[PoseLandmark.RIGHT_SHOULDER] = [4, 4];
  refLandmarks[PoseLandmark.LEFT_ELBOW] = [2, 3];
  refLandmarks[PoseLandmark.RIGHT_ELBOW] = [4, 3];
  refLandmarks[PoseLandmark.LEFT_WRIST] = [1, 2];
  refLandmarks[PoseLandmark.RIGHT_WRIST] = [5, 2];

  const referenceFrameLandmarks = refLandmarks;

  const practiceFrameLandmarks = adjustLandmarks(
    refLandmarks.map(([x, y]) => [x, y] as [number, number]),
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ]
  );

  console.log("created reference landmarks:", referenceFrameLandmarks);
  console.log("created practice landmarks:", practiceFrameLandmarks);

  // Construct FrameData objects
  const referencePose: FrameData = {
    id: "reference",
    landmarks: referenceFrameLandmarks,
    angles: calculateLimbAngles(referenceFrameLandmarks),
    frameNumber: 1,
  };

  const practicePose: FrameData = {
    id: "practice",
    landmarks: practiceFrameLandmarks,
    angles: calculateLimbAngles(practiceFrameLandmarks),
    frameNumber: 1,
  };

  console.log("🤖 Requesting LLM feedback...");
  const feedbackID = await feedbackSystem.analyze(
    referencePose,
    practicePose,
    llm
  );

  const result = feedbackSystem.getFeedback(feedbackID);
  console.log("\n📝 AI-GENERATED FEEDBACK");
  console.log("========================");
  console.log("Feedback:", result.feedback);
  console.log("Accuracy:", result.accuracyValue);
}

/**
 * Test case: The left wrist landmark is too far inward
 */
export async function testLeftWristTooInward(): Promise<void> {
  console.log("\n🧪 TEST CASE: Left wrist too inward");
  console.log("=====================================");

  const feedbackSystem = new Feedback();
  const config = loadConfig();
  const llm = new GeminiLLM(config);

  console.log("🎥 Creating mock pose data...");
  const refLandmarks: Array<[number, number]> = [];
  refLandmarks[PoseLandmark.LEFT_SHOULDER] = [2, 4];
  refLandmarks[PoseLandmark.RIGHT_SHOULDER] = [4, 4];
  refLandmarks[PoseLandmark.LEFT_ELBOW] = [2, 3];
  refLandmarks[PoseLandmark.RIGHT_ELBOW] = [4, 3];
  refLandmarks[PoseLandmark.LEFT_WRIST] = [1, 2];
  refLandmarks[PoseLandmark.RIGHT_WRIST] = [5, 2];

  const referenceFrameLandmarks = refLandmarks;

  const practiceFrameLandmarks = adjustLandmarks(
    refLandmarks.map(([x, y]) => [x, y] as [number, number]),
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [1, 0],
      [0, 0],
    ]
  );

  console.log("created reference landmarks:", referenceFrameLandmarks);
  console.log("created practice landmarks:", practiceFrameLandmarks);

  // Construct FrameData objects
  const referencePose: FrameData = {
    id: "reference",
    landmarks: referenceFrameLandmarks,
    angles: calculateLimbAngles(referenceFrameLandmarks),
    frameNumber: 1,
  };

  const practicePose: FrameData = {
    id: "practice",
    landmarks: practiceFrameLandmarks,
    angles: calculateLimbAngles(practiceFrameLandmarks),
    frameNumber: 1,
  };

  console.log("🤖 Requesting LLM feedback...");
  const feedbackID = await feedbackSystem.analyze(
    referencePose,
    practicePose,
    llm
  );

  const result = feedbackSystem.getFeedback(feedbackID);
  console.log("\n📝 AI-GENERATED FEEDBACK");
  console.log("========================");
  console.log("Feedback:", result.feedback);
  console.log("Accuracy:", result.accuracyValue);
}

/**
 * Test case: Small and large angle differences
 */
export async function testSmallAndLargeDifference(): Promise<void> {
  console.log(
    "\n🧪 TEST CASE: Small and large angle difference (prompt variant test 1)"
  );
  console.log("=====================================");

  const feedbackSystem = new Feedback();
  const config = loadConfig();
  const llm = new GeminiLLM(config);

  console.log("🎥 Creating mock pose data...");
  const refLandmarks: Array<[number, number]> = [];
  refLandmarks[PoseLandmark.LEFT_SHOULDER] = [2, 4];
  refLandmarks[PoseLandmark.RIGHT_SHOULDER] = [4, 4];
  refLandmarks[PoseLandmark.LEFT_ELBOW] = [2, 3];
  refLandmarks[PoseLandmark.RIGHT_ELBOW] = [4, 3];
  refLandmarks[PoseLandmark.LEFT_WRIST] = [1, 2];
  refLandmarks[PoseLandmark.RIGHT_WRIST] = [5, 2];

  const referenceFrameLandmarks = refLandmarks;

  const practiceFrameLandmarks = adjustLandmarks(
    refLandmarks.map(([x, y]) => [x, y] as [number, number]),
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [1, 0],
      [-0.2, 0],
    ]
  );

  console.log("created reference landmarks:", referenceFrameLandmarks);
  console.log("created practice landmarks:", practiceFrameLandmarks);

  // Construct FrameData objects
  const referencePose: FrameData = {
    id: "reference",
    landmarks: referenceFrameLandmarks,
    angles: calculateLimbAngles(referenceFrameLandmarks),
    frameNumber: 1,
  };

  const practicePose: FrameData = {
    id: "practice",
    landmarks: practiceFrameLandmarks,
    angles: calculateLimbAngles(practiceFrameLandmarks),
    frameNumber: 1,
  };

  console.log("🤖 Requesting LLM feedback...");
  const feedbackID = await feedbackSystem.analyze(
    referencePose,
    practicePose,
    llm
  );

  const result = feedbackSystem.getFeedback(feedbackID);
  console.log("\n📝 AI-GENERATED FEEDBACK");
  console.log("========================");
  console.log("Feedback:", result.feedback);
  console.log("Accuracy:", result.accuracyValue);
}

/**
 * Test case: The left wrist landmark is an extreme outlier (e.g., mis-detected)
 */
export async function testNoisyLandmarks(): Promise<void> {
  console.log("\n🧪 TEST CASE: Outlier landmark (prompt variant test 2)");
  console.log("=====================================");

  const feedbackSystem = new Feedback();
  const config = loadConfig();
  const llm = new GeminiLLM(config);

  console.log("🎥 Creating mock pose data...");
  const refLandmarks: Array<[number, number]> = [];
  refLandmarks[PoseLandmark.LEFT_SHOULDER] = [2, 4];
  refLandmarks[PoseLandmark.RIGHT_SHOULDER] = [4, 4];
  refLandmarks[PoseLandmark.LEFT_ELBOW] = [2, 3];
  refLandmarks[PoseLandmark.RIGHT_ELBOW] = [4, 3];
  refLandmarks[PoseLandmark.LEFT_WRIST] = [1, 2];
  refLandmarks[PoseLandmark.RIGHT_WRIST] = [5, 2];

  const referenceFrameLandmarks = refLandmarks;

  const practiceFrameLandmarks = adjustLandmarks(
    refLandmarks.map(([x, y]) => [x, y] as [number, number]),
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [1, 0],
      [-100, 300],
    ]
  );

  console.log("created reference landmarks:", referenceFrameLandmarks);
  console.log("created practice landmarks:", practiceFrameLandmarks);

  // Construct FrameData objects
  const referencePose: FrameData = {
    id: "reference",
    landmarks: referenceFrameLandmarks,
    angles: calculateLimbAngles(referenceFrameLandmarks),
    frameNumber: 1,
  };

  const practicePose: FrameData = {
    id: "practice",
    landmarks: practiceFrameLandmarks,
    angles: calculateLimbAngles(practiceFrameLandmarks),
    frameNumber: 1,
  };

  console.log("🤖 Requesting LLM feedback...");
  const feedbackID = await feedbackSystem.analyze(
    referencePose,
    practicePose,
    llm
  );

  const result = feedbackSystem.getFeedback(feedbackID);
  console.log("\n📝 AI-GENERATED FEEDBACK");
  console.log("========================");
  console.log("Feedback:", result.feedback);
  console.log("Accuracy:", result.accuracyValue);
}

/**
 * Test case: The right wrist landmark is missing (e.g., mis-detected)
 */
export async function testMissingLandmarks(): Promise<void> {
  console.log(
    "\n🧪 TEST CASE: Missing right wrist landmark (prompt variant test 3)"
  );
  console.log("=====================================");

  const feedbackSystem = new Feedback();
  const config = loadConfig();
  const llm = new GeminiLLM(config);

  console.log("🎥 Creating mock pose data...");
  const refLandmarks: Array<[number, number]> = [];
  refLandmarks[PoseLandmark.LEFT_SHOULDER] = [2, 4];
  refLandmarks[PoseLandmark.RIGHT_SHOULDER] = [4, 4];
  refLandmarks[PoseLandmark.LEFT_ELBOW] = [2, 3];
  refLandmarks[PoseLandmark.RIGHT_ELBOW] = [4, 3];
  refLandmarks[PoseLandmark.LEFT_WRIST] = [1, 2];

  const referenceFrameLandmarks = refLandmarks;

  const practiceFrameLandmarks = adjustLandmarks(
    refLandmarks.map(([x, y]) => [x, y] as [number, number]),
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [1, 0],
      [0, 0],
    ]
  );

  console.log("created reference landmarks:", referenceFrameLandmarks);
  console.log("created practice landmarks:", practiceFrameLandmarks);

  // Construct FrameData objects
  const referencePose: FrameData = {
    id: "reference",
    landmarks: referenceFrameLandmarks,
    angles: calculateLimbAngles(referenceFrameLandmarks),
    frameNumber: 1,
  };

  const practicePose: FrameData = {
    id: "practice",
    landmarks: practiceFrameLandmarks,
    angles: calculateLimbAngles(practiceFrameLandmarks),
    frameNumber: 1,
  };

  console.log("🤖 Requesting LLM feedback...");
  const feedbackID = await feedbackSystem.analyze(
    referencePose,
    practicePose,
    llm
  );

  const result = feedbackSystem.getFeedback(feedbackID);
  console.log("\n📝 AI-GENERATED FEEDBACK");
  console.log("========================");
  console.log("Feedback:", result.feedback);
  console.log("Accuracy:", result.accuracyValue);
}

/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
  console.log("🎓 Feedback Test Suite");
  console.log("========================\n");

  try {
    // await testPerfectPoses();
    // await testLeftWristTooInward();
    // await testSmallAndLargeDifference();
    await testNoisyLandmarks();
    await testMissingLandmarks();

    console.log("\n🎉 All test cases completed successfully!");
  } catch (error) {
    console.error("❌ Test error:", (error as Error).message);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  main();
}
