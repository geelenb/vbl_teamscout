function get_most_common_number_per_player(roster_for_games) {
    const name_to_counts = {};

    roster_for_games.forEach(players_in_a_game => {
        players_in_a_game.forEach(player => {
            if (player['Functie'] !== 'S') {
                return
            }
            const rugnr = String(player['RugNr']);
            if (player['RelGUID'] in name_to_counts) {
                if (rugnr in name_to_counts[player['RelGUID']]) {
                    name_to_counts[player['RelGUID']][rugnr] += 1
                } else {
                    name_to_counts[player['RelGUID']][rugnr] = 1
                }
            } else {
                name_to_counts[player['RelGUID']] = {};
                name_to_counts[player['RelGUID']][rugnr] = 1
            }
        })
    });

    const guid_to_most_common = {};
    for (let guid in name_to_counts) {
        if (!guid) {
            continue;
        }
        let max_count = 0;
        for (let number in name_to_counts[guid]) {
            let count = name_to_counts[guid][number];
            if (count > max_count) {
                max_count = name_to_counts[guid][number];
                guid_to_most_common[guid] = number
            }
        }
    }

    return guid_to_most_common
}

const months = ['', 'januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const short_months = ['', 'jan', 'feb', 'maa', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const short_teamnames = [
    "As", "Achel", "Alken", "Asse", "Aarschot", "Anderlecht", "Alsemberg",
    "Bilzerse", "Black Sheep", "Bree", "Beringen", "Brasschaat", "Bertem", "Bavi", "Bulldogs", "Baclo", "Blue Tigers", "Betekom", "Bears", "Boom",
    "Cosmo", "Croonen",
    "Dilbeek", "Dino", "Diest",
    "Elite",
    "Fenics",
    "Gems", "Grimbergen",
    "Hades", "Hasselt BT", "Helchteren", "Hageland", "Haacht", "Halle",
    "Maasmechelen", "Mechelen", "Merchtem",
    "Kortenberg", "Kapelle", "KSTBB",
    "Landen", "Leopoldsburg", "Lummen", "Londerzeelse", "Liège",
    "Machelen", "Molenbeek",
    "Nijlen",
    "Optima", "Orly", "Opwijk", "Overijse",
    "Pelt", "Peer",
    "Rode",
    "Sint-Truiden", "Stevoort", "Streek Inn", "Scherpenheuvel",
    "Tienen", "Tongeren", "Triton", 
    "Vorst",
    "Waremme", "Woluwe", "WIZ", "Waregem", "Wemmel",
    "Zolder", "Zonhoven", "Zemst", "Zaventem",
];
const short_teamname_and_re = short_teamnames.map(short => [short, RegExp(`\\b${short}\\b`)]);

function shorten_teamname(teamname) {
    const found_short_teamname = short_teamname_and_re
        .filter(([short, re]) => re.test(teamname))
        .map(([short, re]) => `${short.trim()} ${teamname[teamname.length - 1]}`)[0]
    return found_short_teamname || teamname;
}

function shorten_teamname_more(teamname) {
    const found_short_teamname = short_teamname_and_re
        .filter(([short, re]) => re.test(teamname))
        .map(([short, re]) => short.trim())[0]
    return found_short_teamname || teamname;
}

const th = content => `<th></th><th colspan="2" style="text-align: left;">${content}</th>`;
const td_data = content => `<td class="data">${content}</td>`;

// const char_for_winst = w => String.fromCodePoint(w ? 0x2705 : 0x274C);
const char_for_winst = w => w ? String.fromCodePoint(0x2705) : '';
// const home_away_char = is_home => String.fromCodePoint(is_home ? 0x1F3E0 : 0x1F697);
const home_away_char = is_home => is_home ? String.fromCodePoint(0x1F3E0) : '';

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


const game_is_home_win = g => g.uitslag.substring(0, 3) - g.uitslag.substring(4, 7) > 0;

const n_home_wins_in_games = (games) => {
    return games.filter(game_is_home_win).length
}


async function colours_for_team(team_id) {
    const org_id = team_id.substring(0, 8);
    const org_details = await fetch_org_details(org_id);

    // debugger;
    const team = org_details[0].teams.find(team => team.guid === team_id);
    return [
        team.shirtKleur || '#FFFFFF',
        team.shirtReserve || '#000000'
    ]
}

const sign = x => x === 0.0 ? '' : x > 0 ? '+' : '-';
const plus_sign = x => x >= 0 ? '+' : '';