/**
 * Feedback Concept - AI Augmented Version
 */

import { GeminiLLM } from "./gemini-llm";
import { FrameData, LIMB_CONNECTIONS, PoseLandmark } from "./frameData";

// Feedback entries
export interface FeedbackEntry {
  feedbackID: string;
  referenceFrameData: FrameData;
  practiceFrameData: FrameData;
  feedback: string;
  accuracyValue: number;
}

export class Feedback {
  private feedbackList: FeedbackEntry[] = [];

  /**
   * Analyze reference and practice poses, compute accuracy,
   * and generate AI-augmented feedback using an LLM.
   */
  async analyze(
    referenceFrameData: FrameData,
    practiceFrameData: FrameData,
    llm: GeminiLLM
  ): Promise<string> {
    console.log("🤖 Comparing practice pose to reference...");

    const diff = this.computeAngleDifference(
      referenceFrameData,
      practiceFrameData
    );
    const accuracyValue = this.calculateAccuracy(diff);

    const prompt = this.createFeedbackPrompt(
      diff,
      accuracyValue,
      referenceFrameData,
      practiceFrameData
    );
    const aiFeedback = await llm.executeLLM(prompt);

    const feedbackID = `fb-${referenceFrameData.id}-${practiceFrameData.id}`;
    const entry: FeedbackEntry = {
      feedbackID,
      referenceFrameData,
      practiceFrameData,
      feedback: aiFeedback,
      accuracyValue,
    };

    this.feedbackList.push(entry);

    console.log(`✅ Feedback generated [${feedbackID}]`);

    // Run some validator
    // 1. Check that all landmarks mentioned in the feedback exist in PoseLandmark enum
    const checkLandmarkPromt =
      this.createCheckExistingLandmarkPrompt(aiFeedback);
    const existingLandmarks = await llm.executeLLM(checkLandmarkPromt);
    this.validateExistingLandmarks(existingLandmarks);

    // 2. Check that the mood of the feedback is positive
    const checkMoodPrompt = this.createCheckMoodPrompt(aiFeedback);
    const isPositive = await llm.executeLLM(checkMoodPrompt);
    const isPositiveBool = isPositive.trim().toUpperCase() === "TRUE";
    if (!isPositiveBool) {
      console.warn(
        `⚠️ Warning: Feedback [${feedbackID}] mood is not positive. Please review.`
      );
    } else {
      console.log("✅ Feedback mood is positive.");
    }

    // 3. Check that the feedback is concise enough (under 500 words)
    const wordCount = aiFeedback.trim().split(/\s+/).length;
    if (wordCount > 500) {
      console.warn(
        `⚠️ Warning: Feedback [${feedbackID}] is too long. Please review.`
      );
    } else {
      console.log("✅ Feedback is concise enough.");
    }
    
    return feedbackID;
  }

  /**
   * Get the stored feedback by ID
   */
  getFeedback(feedbackID: string): { feedback: string; accuracyValue: number } {
    const entry = this.feedbackList.find((f) => f.feedbackID === feedbackID);
    if (!entry) {
      throw new Error(`Feedback with ID ${feedbackID} not found.`);
    }
    return {
      feedback: entry.feedback,
      accuracyValue: entry.accuracyValue,
    };
  }

  /**
   * Compute raw difference between corresponding angles in two PoseData objects.
   */
  private computeAngleDifference(
    reference: FrameData,
    practice: FrameData
  ): Array<number> {
    const differences: Array<number> = [];

    for (let i = 0; i < reference.angles.length; i++) {
      // Check if practice has a corresponding angle at the same index
      if (practice.angles[i] !== undefined) {
        differences[i] = practice.angles[i] - reference.angles[i];
      } else {
        differences[i] = 0;
      }
    }

    return differences;
  }

  /**
   * Calculate an overall accuracy value from angle differences.
   */
  private calculateAccuracy(differences: Array<number>): number {
    const values = Object.values(differences);
    if (values.length === 0) return 0;

    let sum = 0;
    let count = 0;

    for (const val of values) {
      if (!isNaN(val)) {
        sum += Math.abs(val);
        count++;
      }
    }

    if (count === 0) return 0; // all values were NaN

    const avgDiff = sum / count;
    return Math.max(0, 100 - avgDiff); // TODO: refine this formula
  }

  /**
   * Create a prompt for the LLM based on pose differences and accuracy score.
   */
  private createFeedbackPrompt(
    differences: Array<number>,
    accuracyValue: number,
    referenceFrameData: FrameData,
    practiceFrameData: FrameData
  ): string {
    const angleFeedback = Object.entries(differences)
      .map(([angle, diff]) => `- ${angle}: difference = ${diff.toFixed(2)}`)
      .join("\n");

    const limbConnectionsString = LIMB_CONNECTIONS.map(
      ([start, end]) => `${PoseLandmark[start]} to ${PoseLandmark[end]}`
    ).join(", ");

    const refLandmarks = referenceFrameData.landmarks;
    const practiceLandmarks = practiceFrameData.landmarks;

    const poseEnumString = Object.entries(PoseLandmark)
      .filter(([key, value]) => typeof value === "number")
      .map(([name, value]) => `${value} = ${name}`)
      .join("\n");

    return `
You are a professional dance or movement coach AI.
You are given differences between a reference choreography pose and a user's practice pose.

Analyze these angle differences and provide constructive, encouraging feedback
with clear instructions on how the user can improve their form.

DATA:
Accuracy Score: ${accuracyValue.toFixed(1)}%
Angle Differences:
${angleFeedback}
LimbConnections associated with each angle for reference:
${limbConnectionsString}

Reference Landmarks Coordinates (PoseLandmark enum index order):
${JSON.stringify(refLandmarks)}
Practice Landmarks Coordinates (PoseLandmark enum index order):
${JSON.stringify(practiceLandmarks)}
PoseLandmark enum for reference:
${poseEnumString}

Make sure to add a concise note on potential landmark detection issues at the end if:
1. If there is a landmark coordinate (don't mention angles) that is extremely different from other coordinates
within that set of reference or practice pose, highlight it as a potential mis-detection of the joint. DO NOT attempt
to give any feedback on any angle involving that joint.
2. If an angle is NaN, it means one of the joints involved in that angle is missing. Mention the specific missing joints
using the LimbConnections and PoseLandmark enum reference.

Respond with a short, natural paragraph explaining:
1. Identify which body parts need adjustment based on the angle differences
(DO NOT including any angles involving a joint that's an outlier).
3. For mismatches, provide concise coaching tips for improvement.
4. Provide a motivational remark to encourage the user.


`;
  }

  private createCheckExistingLandmarkPrompt(feedback: string): string {
    return `given this feedback ${feedback}, give me a list of all the joints
mentioned in the feedback in one list in this format:
[JOINT_A, JOINT_B, ...]
1. Only include joints that are mentioned in the feedback.
2. Use all caps and seperate words with underscores "_".`;
  }

  private validateExistingLandmarks(existingLandmarksStr: string): void {
    // Remove brackets and whitespace, then split by comma
    const landmarks = existingLandmarksStr
      .replace(/^\[|\]$/g, "") // remove [ and ]
      .split(",")
      .map((s) => s.trim());

    for (const lm of landmarks) {
      if (!(lm in PoseLandmark)) {
        throw new Error(`LLM referenced unknown landmark: "${lm}"`);
      }
    }

    console.log("✅ All landmarks mentioned exist in PoseLandmark enum.");
  }
  private createCheckMoodPrompt(feedback: string): string {
    return `given this feedback ${feedback}, is the overall mood of the feedback positive?
Respond with one word "TRUE" or "FALSE".`;
  }
}
