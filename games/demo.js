game = {
    title: "Demo Game",
    groups: [
        "Things in Group 1",
        "Things in Group 2",
        "Things in Group 3"
    ],
    phrases: {
        "only in Group 1" : {
            short: "Group 1",
            groupIds: [1]
        },
        "only in Group 2" : {
            short: "Group 2",
            groupIds: [2]
        },
        "only in Group 3" : {
            short: "",
            groupIds: [3]
        },
        "in Groups 1 & 2" : {
            short: "1 & 2",
            groupIds: [1,2]
        },
        "in Groups 2 & 3" : {
            short: "2 & 3",
            groupIds: [2,3]
        },
        "in Groups 1 & 3" : {
            short: "1 & 3",
            groupIds: [1,3]
        },
        "in Groups 1, 2, 3" : {
            short: "1,2,3",
            groupIds: [1,2,3]
        }
    }
}

games.push(game)
