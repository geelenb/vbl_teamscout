function cache_save(key, value) {
    localStorage.setItem(key, LZString.compress(JSON.stringify(value)));
}

function cache_load(key) {
    console.warn(`Using older result of ${key}`);
    return JSON.parse(LZString.decompress(localStorage.getItem(key)))
}

async function fetch_games(team_guid_plus) {
    const url = `https://vblcb.wisseq.eu/VBLCB_WebService/data/TeamMatchesByGuid?teamGuid=${team_guid_plus}`;
    const localStorage_key = url.split('/').pop();

    try {
        // Always try to load these fresh
        const json = await (await fetch(
                url, {
                    method: "GET",
                    headers: []
                })
        ).json();

        try {
            cache_save(localStorage_key, json);
        } catch {}

        return json
    } catch (te) {
        try {
            result = cache_load(localStorage_key);
            return result;
        } catch {}
    }
}

async function fetch_poule_games(issguid) {
    const url = `https://vblcb.wisseq.eu/VBLCB_WebService/data/PouleMatchesByGuid?issguid=${issguid}`;
    const localStorage_key = url.split('/').pop();

    try {
        const json = await (await fetch(
                url, {
                    method: "GET",
                    headers: []
                })
        ).json();

        try {
            cache_save(localStorage_key, json);
        } catch {}

        return json
    } catch (te) {
        try {
            result = cache_load(localStorage_key);
            return result;
        } catch {}
        
        console.error(`Failed to fetch in fetch_poule_games('${issguid}')`);
    }
}

// BVBL21229120LIHSE31A

async function fetch_rosters(game_uid) {
    const referrer = `https://vblweb.wisseq.eu/Home/MatchDetail?wedguid=${game_uid}`;
    const localStorage_key =  referrer.split('/').pop();

    try {
        return cache_load(localStorage_key);
    } catch {}

    console.log(`fetching game stats ${game_uid}`);

    const json = await (await fetch(
        "https://vblcb.wisseq.eu/VBLCB_WebService/data/DwfDeelByWedGuid",
        {
            "headers": {
                "content-type": "application/json; charset=UTF-8",
            },
            "referrer": referrer,
            "body": `{"AuthHeader":"na","WQVer":"ddc1.0","WedGUID":"${game_uid}","CRUD":"R"}`,
            "method": "PUT",
        }
    )).json();

    try {
        cache_save(localStorage_key, json);
    } catch {}
    return json
}

async function fetch_gebeurtenis_data(game_uid, use_cache) {
    const referrer = `https://vblweb.wisseq.eu/Home/MatchDetail?wedguid=${game_uid}&ID=Uitslag`
    const localStorage_key = referrer.split('/').pop();

    if (use_cache) {
        try {
            return cache_load(localStorage_key);
        } catch {}
    }

    console.log(`fetching gebeurtenis data ${game_uid} ...`);

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
            "referrer": referrer,
            // "referrerPolicy": "no-referrer-when-downgrade",
            "body": `{"AuthHeader":"na","WQVer":"ddc1.0","WedGUID":"${game_uid}","CRUD":"R"}`,
            "method": "PUT",
            // "mode": "cors"
        })).json();


    if (use_cache) {
        try {
            cache_save(localStorage_key, json);
        } catch {}
    }
    return json
}


async function fetch_rosters_for_games(game_datas, team_id) {
    return (await Promise.all(
        game_datas
            .map(game => game.guid)
            .map(fetch_rosters)
    )).map((game, i) => get_relevant_part_from_game_data(
        game,
        is_home_game_for_team(game_datas[i], team_id)
    ));
}

async function fetch_gebeurtenis_data_for_games(game_datas) {
    return await Promise.all(
        game_datas
            .map(game => {debugger;fetch_gebeurtenis_data(game.guid, true)})
    );
}



