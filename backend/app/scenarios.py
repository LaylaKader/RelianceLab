SCENARIOS = [
    {
        "id": "study-source",
        "category": "Education",
        "title": "A claim about study methods",
        "prompt": "A student asks whether spaced practice is generally more effective than cramming for long-term retention of factual material.",
        "ai_recommendation": "For long-term retention, spaced practice is generally more effective than massed cramming. The size of the benefit depends on the learner and subject.",
        "ai_option_id": "spaced",
        "confidence": 0.82,
        "uncertainty": "The size of the benefit varies by subject, learner, schedule, and how learning is measured.",
        "evidence": "The scenario's evidence summary supports spaced practice for long-term retention, while warning against treating it as universally best for every task.",
        "options": [
            {"id": "spaced", "label": "Use spaced practice for long-term retention"},
            {"id": "cram", "label": "Use one concentrated cramming session"},
            {"id": "depends", "label": "The evidence cannot support any general preference"}
        ],
        "correct_option_ids": ["spaced"],
        "ai_recommendation_correct": True,
        "rationale": "The recommendation is appropriately qualified and matches the evidence summary. It does not claim that spaced practice is best in every situation."
    },
    {
        "id": "health-symptom",
        "category": "Health information",
        "title": "A persistent high fever",
        "prompt": "A text-only symptom assistant is asked about a persistent high fever. It cannot examine the person or review their medical history.",
        "ai_recommendation": "Because the fever has persisted, seek advice from a qualified health professional rather than relying on this chat response to rule out a serious cause.",
        "ai_option_id": "professional",
        "confidence": 0.76,
        "uncertainty": "A text-only system cannot assess severity, medical history, age, other symptoms, or warning signs.",
        "evidence": "The scenario provides no clinical examination or patient history. The safe conclusion is that the tool cannot determine the cause or rule out a serious condition.",
        "options": [
            {"id": "wait", "label": "Rely on the assistant and wait several days"},
            {"id": "professional", "label": "Seek advice from a qualified health professional"},
            {"id": "ignore", "label": "Ignore the symptom"}
        ],
        "correct_option_ids": ["professional"],
        "ai_recommendation_correct": True,
        "rationale": "The recommendation acknowledges the system's limits and directs the person to qualified care. This scenario is educational, not medical advice."
    },
    {
        "id": "donation-proof",
        "category": "Civic information",
        "title": "An unverified donation claim",
        "prompt": "An AI assistant says a charity transferred 95% of donations to a project, but provides no receipt, audit, or transaction record.",
        "ai_recommendation": "The 95% transfer claim is probably true because the assistant reports it confidently.",
        "ai_option_id": "trust",
        "confidence": 0.95,
        "uncertainty": "A confidence statement is not proof. The claim needs independently checkable records and a defined accounting period.",
        "evidence": "No supporting documentation is supplied. The percentage cannot be verified from the assistant's statement alone.",
        "options": [
            {"id": "trust", "label": "Accept the 95% claim as true"},
            {"id": "verify", "label": "Request and verify supporting records"},
            {"id": "fraud", "label": "Conclude that the charity committed fraud"}
        ],
        "correct_option_ids": ["verify"],
        "ai_recommendation_correct": False,
        "rationale": "The assistant treats confidence as evidence. The available information supports verification, not acceptance and not an accusation of fraud."
    },
    {
        "id": "data-chart",
        "category": "Workplace",
        "title": "A small survey and a causal claim",
        "prompt": "An AI assistant reviews a survey of eight people after a new onboarding process. There is no comparison group or baseline measurement.",
        "ai_recommendation": "The new onboarding process caused satisfaction to rise.",
        "ai_option_id": "causal",
        "confidence": 0.84,
        "uncertainty": "A small sample and the lack of a comparison group make causal conclusions unreliable.",
        "evidence": "Eight survey responses can describe those respondents' feedback, but the design cannot establish that the new process caused a change.",
        "options": [
            {"id": "causal", "label": "The process caused satisfaction to rise"},
            {"id": "descriptive", "label": "The responses are descriptive; causation is not established"},
            {"id": "universal", "label": "Everyone will be more satisfied"}
        ],
        "correct_option_ids": ["descriptive"],
        "ai_recommendation_correct": False,
        "rationale": "The assistant overstates what a small, uncontrolled survey can show. Descriptive feedback is not causal evidence."
    }
]


def publicScenario(scenario):
    return {
        key: value
        for key, value in scenario.items()
        if key not in ("correct_option_ids", "rationale", "ai_recommendation_correct")
    }
