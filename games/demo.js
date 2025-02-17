game = {
    title: "Demo Game",
    groups: [
        {
            id: 1,
            label: "Things in Group 1"
        },
        {
            id: 2,
            label: "Things in Group 2"
        },
        {
            id: 3,
            label: "Things in Group 3"
        }
    ],
    phrases: [
        {
            phrase: "only in Group 1",
            short: "Group 1", // use this to save space, if defined.
            groupIds: [1]
        },
        {
            phrase: "only in Group 2",
            short: "Group 2",
            groupIds: [2]
        },
        {
            phrase: "only in Group 3",
            short: "", // empty or missing altogether just uses the phrase
            groupIds: [3]
        },
        {
            phrase: "in Groups 1 & 2",
            short: "1 & 2",
            groupIds: [1,2]
        },
        {
            phrase: "in Groups 2 & 3",
            short: "2 & 3",
            groupIds: [2,3]
        },
        {
            phrase: "in Groups 1 & 3",
            short: "1 & 3",
            groupIds: [1,3]
        },
        {
            phrase: "in Groups 1, 2, 3",
            short: "1,2,3",
            groupIds: [1,2,3]
        }
    ]
}

games.push(game)
