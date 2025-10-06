<concept_spec>
concept Feedback [PoseData]
purpose
    highlight differences between practice video and reference choreography

principle
    after a video is broken into different poses, we can generate feedback on different body parts

state
    a set of Feedback with
        A feedbackID String
        A referencePoseData PoseData 
        A practicePoseData PoseData
        A feedback String
        A accuracyValue Number

actions
    analyze(referencePoseData: PoseData, practicePoseData: PoseData, llm: GeminiLLM): (feedbackID: String)
        requires: both PoseData exist
        effect: compares practice PoseData to reference PoseData, and creates and stores new Feedback.
        Use LLM to interpret pose difference data, identify key areas for improvement, and generate natural-language coaching tips

    getFeedback(feedbackID: String): (feedback: String, accuracyValue: Number)
        requires: feedback with feedbackID exists
        effect: returns mismatched body parts with suggestions and accuracy score

</concept_spec>