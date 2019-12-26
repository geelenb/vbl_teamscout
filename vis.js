function get_most_common_number_per_player(player_list_for_games) {
    const name_to_counts = {};

    player_list_for_games.forEach(players_in_a_game => {
        players_in_a_game.forEach(player => {
            if (player['Functie'] !== 'S') {
                return
            }
            const rugnr = String(player['RugNr']);
            if (player['Naam'] in name_to_counts) {
                if (rugnr in name_to_counts[player['Naam']]) {
                    name_to_counts[player['Naam']][rugnr] += 1
                } else {
                    name_to_counts[player['Naam']][rugnr] = 1
                }
            } else {
                name_to_counts[player['Naam']] = {};
                name_to_counts[player['Naam']][rugnr] = 1
            }
        })
    });

    const name_to_most_common = {};
    for (let naam in name_to_counts) {
        if (!naam) {
            continue
        }
        let max_count = 0;
        for (let nummer in name_to_counts[naam]) {
            let count = name_to_counts[naam][nummer];
            if (count > max_count) {
                max_count = name_to_counts[naam][nummer];
                name_to_most_common[naam] = nummer
            }
        }
    }

    return name_to_most_common
}


function shorten_teamname(teamname) {
    return [
        " As ", "Achel", "Alken",
        "Bilzerse", "Black Sheep", "Bree", "Beringen",
        "Cosmo",
        "Hades", "Hasselt BT", "Helchteren", "Hageland",
        "Maasmechelen",
        "Leopoldsburg", "Lommel", "Lummen",
        "Optima", "Orly",
        "Sint-Truiden", "Stevoort",
        "Zolder", "Zonhoven",
    ].filter(kw =>
        teamname.toLowerCase().includes(kw.toLowerCase())
    ).map(kw => `${kw.trim()} ${teamname[teamname.length - 1]}`)[0] || teamname;
}

function make_data_table(data, attribute_to_display) {
    const team_id_plus = data.team_id_plus;
    const games = data.games;
    const player_list = data.player_list;
    const name_to_most_common_number = data.name_to_most_common_number;
    const data_per_player_per_game = data[attribute_to_display];

    const is_home_game_for_this_team = game => is_home_game_for_team(game, team_id_plus);
    const game_is_at_home = games.map(is_home_game_for_this_team);

    let verschillen = games.map(game => eval(game['uitslag'].substring(0, 7)));
    verschillen = verschillen.map((v, i) => game_is_at_home[i] ? v : -v);
    const winst = verschillen.map(v => (v > 0));
    // verschillen = verschillen.map(Math.abs)
    verschillen = verschillen.map(v => v > 0 ? '+' + v : v);

    const left_cells = 2;

    const th = content => `<th colspan="${left_cells}" style="text-align: left;">${content}</th>`;
    const td = content => `<td class="data">${content}</td>`;

    const emoji_for_winst = w => String.fromCodePoint(w ? 0x2705 : 0x274C);
    // const home_away_emoji = is_home => String.fromCodePoint(is_home ? 0x1F3E0 : 0x1F697);
    const home_away_emoji = is_home => String.fromCodePoint(is_home ? 0x1F3E0 : '');

    const attribute_str = {
        'points': 'Punten',
        'plus_minus': 'Plus minus',
        'fouls': 'Fouten',
        'minutes': 'Minuten<br>(ongeveer)',
        'free_throws': 'Gescoorde<br>vrijworpen',
        'three_pt': 'Driepunters',
    }[attribute_to_display];

    const innerhtml = [// list of strings we will join at the end
        // row: names of opponents
        '<tr class="teamnaam">',
        th(attribute_str),
        ...games.map(game => get_opponent_from_game(game, team_id_plus))
            .map(team =>
                `<th><div><p><a href="autoscout.html?team=${team.id_plus}">${shorten_teamname(team.naam)}</a></p></div></th>`
            ),
        '<td></td>'.repeat(3),
        '</tr>',

        // row: jaar
        // '<tr class="jaar">',
        // th('Jaar'),
        // ...games.map(game => td(game.datumString.substring(8))),
        // '</tr>',

        // row: maand
        '<tr class="maand">',
        th('Maand'),
        ...games.map(game => game.datumString.substring(3, 5)).map(Number).map(td),
        '<td></td>'.repeat(3),
        '</tr>',

        // row: dag
        '<tr class="dag">',
        th('Dag'),
        ...games.map(game => td(game.datumString.substring(0, 2))),
        '<td></td>'.repeat(3),
        '</tr>',

        // row: winst
        '<tr class="winst">',
        th('Winst'),
        ...winst.map(emoji_for_winst).map(td),
        '<td></td>'.repeat(3),
        '</tr>',

        // row: verschil
        '<tr class="verschil">',
        th('Verschil'),
        ...verschillen.map(td),
        '<td></td>'.repeat(3),
        '</tr>',

        // row: thuis
        '<tr class="thuis">',
        th('Thuis'),
        ...games.map(g => is_home_game_for_team(g, team_id_plus))
            .map(home_away_emoji)
            .map(text => `<td class="borderbottom data">${text}</td>`),
        td('&sum;'),
        td('#'),
        td('/'),
        '</tr>'
    ];

    // rows for every player
    const sorted_names = (
        Object.keys(name_to_most_common_number)
            .sort((a, b) => Number(name_to_most_common_number[a]) - Number(name_to_most_common_number[b]))
    );

    // for (naam of sorted_names) {
    sorted_names.forEach(name => {
        const number = name_to_most_common_number[name];

        const disp_name = data.team_id_plus.includes('BVBL1049HSE') ? name.split(' ')[0] : name;

        innerhtml.push(
            '<tr class="player">',
            `<td class="spelersnaam">${disp_name}</td>`,
            `<td class="data borderright">${number}</td>`,
        );

        let sum = 0;
        let count = 0;
        player_list.forEach((game_stats, i) => {
            let player_stats = game_stats.filter(stats => stats['Naam'] === name);

            if (player_stats.length === 0) {
                innerhtml.push(td(''))
            } else {
                player_stats = player_stats[0];
                let data_cell = data_per_player_per_game[i][game_is_at_home[i] ? 'T' : 'U'][player_stats.RelGUID] || "0";

                sum += parseInt(data_cell);
                count += 1;

                innerhtml.push(td(data_cell))
            }
        });

        innerhtml.push(
            `<td class="data borderleft">${sum}</td>`,
            td(count),
            td((sum / count).toFixed(1)),
            '</tr>'
        );
    });

    const table = document.createElement('table');
    table.innerHTML = innerhtml.join('');

    return table
}

function table_from_list_of_objs(objs) {
    let table = ['<table>'];
    let keys = [];
    // for (obj of objs) {
    objs.forEach(obj => {
        table.push('<tr>');

        for (let key of keys) {
            table.push('<td>' + (obj[key] || '') + '</td>')
        }

        for (let key in obj) {
            if (keys.indexOf(key) === -1) {
                table.push('<td>', obj[key], '</td>');
                keys.push(key)
            }
        }
        table.push('</tr>')
    });

    table.push('</table>');

    table[0] += '<tr>' + keys.map(key => `<th>${key}</th>`).join('') + '</tr>';

    return table.join('')
}

