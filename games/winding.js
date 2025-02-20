game = {
    title: "Winding",
    groups: [
        {
            id: 1,
            label: "Finance"
        },
        {
            id: 2,
            label: "Rivers"
        },
        {
            id: 3,
            label: "Askew"
        }
    ],
    phrases: [
        {
            phrase: "Loan",
            short: "", // use this to save space, if defined.
            groupIds: [1]
        },
        {
            phrase: "Rapid",
            short: "",
            groupIds: [2]
        },
        {
            phrase: "Tilt",
            short: "", // empty or missing altogether just uses the phrase
            groupIds: [3]
        },
        {
            phrase: "Deposit",
            short: "",
            groupIds: [1,2]
        },
        {
            phrase: "Slope",
            short: "",
            groupIds: [2,3]
        },
        {
            phrase: "Dip",
            short: "",
            groupIds: [1,3]
        },
        {
            phrase: "Bank",
            short: "",
            groupIds: [1,2,3]
        }
    ]
}

games.push(game)
