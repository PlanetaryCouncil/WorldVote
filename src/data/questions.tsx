export interface Question {
    title: string;
    description: string;
    yesno? : boolean;
}

export const questions: Question[] = [
    {
        title: "End the war now?",
        description: `The war is not serving anyone.
        It can potentially lead to a nuclear option.
        The world would be more stable if the war ended now.`
    },
    {
        title: "Putin should have an exit option without losing face.",
        description: `For example: mental health issue.
        Losing touch with reality.
        Getting high on power and drugs.`
    },
    {
        title: "Disputed land can temporarily become international jurisdiction.",
        description: `Boys cannot agree so noone can have it.
        It is destroyed anyway.
        Fewer people live there now.`
    },
    {
        title: "We can build cities for refugees affected by the climate change.",
        description: `The UN Refugee Agency estimates there are more than 100m refugees worldwide.
        Building new cities in places resilient to climate change.
        It is better to start planning now and prepare for the future.`
    }
]

export const questionsCannabis: Question[] = [
    {
        title: "Do you support legalisation of cannabis?",
        description: ``,
        yesno: true
    },
    {
        title: "Do you think majoriry supports legalisation of cannabis?",
        description: ``,
        yesno: true
    },
    {
        title: "On a scale of 1 to 10, how much do you support legalisation of cannabis?",
        description: ``
    },
    {
        title: "On a scale of 1 to 10, what do you think is the average support for legalisation of cannabis?",
        description: ``
    }
]