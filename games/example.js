game = {
    title: "Example Game",
    groups: [
        "Things in Group A",
        "Things in Group B",
        "Things in Group C"
    ],
    phrases: {
        "This is only in Group A": {
            short: "Group A",
            groupIds: [1]
        },
        "Only in Group B": {
            short: "Group B",
            groupIds: [2]
        },
        "Group C only": {
            groupIds: [3]
        },
        "In Groups A & B": {
            short: "A & B",
            groupIds: [1,2]
        },
        "In Groups B & C": {
            short: "B & C",
            groupIds: [2,3]
        },
        "Shared by Groups A & C": {
            short: "A & C",
            groupIds: [1,3]
        },
        "In All Groups": {
            short: "A,B,C",
            groupIds: [1,2,3]
        }
    }
}

games.push(game)
