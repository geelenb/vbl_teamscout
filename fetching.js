async function fetch_games(team_guid_plus) {
    const localStorage_key = `games_for_team_${team_guid_plus}`;

    try {
        const json = await (await fetch(
                `https://vblcb.wisseq.eu/VBLCB_WebService/data/TeamMatchesByGuid?teamGuid=${team_guid_plus}`, {
                    method: "GET",
                    headers: []
                })
        ).json();

        localStorage.setItem(localStorage_key, JSON.stringify(json));

        return json
    } catch (te) {
        if (localStorage.getItem(localStorage_key)) {
            console.warn(`Using older result of load_games('${team_guid_plus}')`);
            return JSON.parse(localStorage.getItem(localStorage_key))
        }
        console.error(`Failed to fetch in load_games('${team_guid_plus}')`);

    }
}

async function fetch_game_stats(game_uid) {
    const localStorage_key = `game_stats_${game_uid}`;

    if (localStorage.getItem(localStorage_key)) {
        return JSON.parse(localStorage.getItem(localStorage_key));
    }

    if (game_uid === 'BVBL19209120LIHSE31BFB') {
        console.log('loading game stats json from local server');
        return (await (await fetch(
            'jsons/teamdetails.json',
        )).json())
    }

    console.log(`fetching game stats ${game_uid}`);

    const json = await (await fetch(
        "https://vblcb.wisseq.eu/VBLCB_WebService/data/DwfDeelByWedGuid",
        {
            "headers": {
                "content-type": "application/json; charset=UTF-8",
            },
            "referrer": `https://vblweb.wisseq.eu/Home/MatchDetail?wedguid=${game_uid}`,
            "body": `{"AuthHeader":"na","WQVer":"ddc1.0","WedGUID":"${game_uid}","CRUD":"R"}`,
            "method": "PUT",
        }
    )).json();

    localStorage.setItem(localStorage_key, JSON.stringify(json));

    return json
}

async function fetch_gebeurtenis_data(game_uid) {
    const localStorage_key = `gebeurtenis_data_${game_uid}`;

    if (localStorage.getItem(localStorage_key)) {
        return JSON.parse(localStorage.getItem(localStorage_key));
    }

    if (game_uid === 'BVBL19209120LIHSE31BFB') {
        console.log('loading gebeurtenis_data json from local server');
        return (await (await fetch(
            'jsons/gebeurtenis_data.json',
        )).json())
    }

    console.log(`fetching gebeurtenis data ${game_uid}`);

    const json = await (await fetch(
        "https://vblcb.wisseq.eu/VBLCB_WebService/data/DwfVgngByWedGuid",
        {
            // "credentials":"include",
            "headers": {
                // "accept": "*/*",
                // "accept-language": "en-US,en;q=0.9,nl;q=0.8,en-GB;q=0.7,fr;q=0.6",
                "authorization": "na",
                "content-type": "application/json; charset=UTF-8",
                // "sec-fetch-mode": "cors",
                // "sec-fetch-site": "same-site"
            },
            "referrer": `https://vblweb.wisseq.eu/Home/MatchDetail?wedguid=${game_uid}&ID=Uitslag`,
            // "referrerPolicy": "no-referrer-when-downgrade",
            "body": `{"AuthHeader":"na","WQVer":"ddc1.0","WedGUID":"${game_uid}","CRUD":"R"}`,
            "method": "PUT",
            // "mode": "cors"
        })).json();

    localStorage.setItem(localStorage_key, JSON.stringify(json));
    return json
}

async function fetch_match(game_uid) {
    console.log(`fetching gebeurtenis data ${game_uid}`);

    if (game_uid === 'BVBL19209120LIHSE31BFB') {
        console.log('loading gebeurtenis_data json from local server');
        return (await (await fetch(
            'jsons/match.json',
        )).json())
    }

    const json = await (await fetch(`https://vblcb.wisseq.eu/VBLCB_WebService/data/MatchByWedGuid?issguid=${game_uid}`, {
        "credentials": "omit",
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9,nl;q=0.8,en-GB;q=0.7,fr;q=0.6",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": `https://vblweb.wisseq.eu/Home/MatchDetail?wedguid=${game_uid}`,
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors"
    }).json());

    return json
}

async function fetch_player_list_for_games(game_datas, team_id) {
    return (await Promise.all(
        game_datas
            .map(game => game.guid)
            .map(fetch_game_stats)
    )).map((game, i) => get_relevant_part_from_game_data(
        game,
        is_home_game_for_team(game_datas[i], team_id)
    ));
}

async function fetch_gebeurtenis_data_for_games(game_datas) {
    return await Promise.all(
        game_datas
            .map(game => game.guid)
            .map(fetch_gebeurtenis_data)
    );
}



