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
            groupIds: [1]
        },
        {
            phrase: "only in Group 2",
            groupIds: [2]
        },
        {
            phrase: "only in Group 3",
            groupIds: [3]
        },
        {
            phrase: "in Groups 1 & 2",
            groupIds: [1,2]
        },
        {
            phrase: "in Groups 2 & 3",
            groupIds: [2,3]
        },
        {
            phrase: "in Groups 1 & 3",
            groupIds: [1,3]
        },
        {
            phrase: "in Groups 1, 2, 3",
            groupIds: [1,2,3]
        }
    ]
}

games.push(game)
