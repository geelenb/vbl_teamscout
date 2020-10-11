function initialize_per_player(gebeurtenis_data, value = 0) {
    gebeurtenis_data = gebeurtenis_data['GebNis'] || gebeurtenis_data;
    return (
        gebeurtenis_data
            .filter(geb => (geb['GebStatus'] === 10))
            .reduce((acc, geb) => ({...acc, [geb['RelGUID']]: value}), {})
    )
}

function gebeurtenis_data_to_points(gebeurtenis_data) {
    if (gebeurtenis_data === null) {
        return {}
    }
    gebeurtenis_data = gebeurtenis_data['GebNis'] || gebeurtenis_data;
    let points = initialize_per_player(gebeurtenis_data, 0);
    gebeurtenis_data.forEach(geb => {
        if (geb['GebType'] === 10) {
            points[geb['RelGUID']] |= 0; // some games don't record in/uit
            points[geb['RelGUID']] += parseInt(geb['Text'].split(' ')[0]);
        }
    });
    return points
}

function gebeurtenis_data_to_plus_minus(gebeurtenis_data) {
    if (gebeurtenis_data === null) {
        return {}
    }
    gebeurtenis_data = gebeurtenis_data['GebNis'] || gebeurtenis_data;
    let plus_minus = initialize_per_player(gebeurtenis_data, 0);

    let players_on_field = [];

    gebeurtenis_data.forEach(geb => {
        if (geb['GebType'] === 50) {
            // wissel
            if (geb['Text'] === 'in') {
                players_on_field.push(geb['RelGUID'])
            } else if (geb['Text'] === 'uit') {
                players_on_field = (
                    players_on_field.filter(v => v !== geb['RelGUID'])
                )
            }
        } else if (geb['GebType'] === 10) {
            // score
            let punten = Number(geb['Text'].split(' ')[0]);
            if (geb['TofU'] === 'U') {
                punten = -punten
            }
            for (let player of players_on_field) {
                plus_minus[player] += punten
            }
            for (let player of players_on_field) {
                plus_minus[player] -= punten
            }
        }
    });
    return plus_minus
}

function gebeurtenis_data_to_fouls(gebeurtenis_data) {
    if (gebeurtenis_data === null) {
        return {}
    }
    gebeurtenis_data = gebeurtenis_data['GebNis'] || gebeurtenis_data;
    let fouls = initialize_per_player(gebeurtenis_data, '');

    for (let geb of gebeurtenis_data) {
        if (geb['GebType'] === 30 && geb['GebStatus'] === 10) {
            fouls[geb['RelGUID']] += geb['Text'][0]
        }
    }
    const filter_special_fouls = foul_str => Array.from(foul_str).filter(p => (p !== 'P')).join('');
    const fouls_html_representation = foul_str => `${foul_str.length}<sup>${filter_special_fouls(foul_str)}</sup>`;

    for (let id in fouls) {
        fouls[id] = fouls_html_representation(fouls[id])
    }

    return fouls
}

function gebeurtenis_data_to_minutes(gebeurtenis_data) {
    if (gebeurtenis_data === null) {
        return {}
    }
    gebeurtenis_data = gebeurtenis_data['GebNis'] || gebeurtenis_data;
    let minutes = initialize_per_player(gebeurtenis_data, 0);
    let players_on_field = [];

    for (let geb of gebeurtenis_data) {
        if (geb['GebStatus'] === 10) {
            if (geb['GebType'] === 40) {
                // last 10 uit's get 1 for free to ajust for counting the minutes 1-10
                gebeurtenis_data
                    .filter(geb2 => geb['Index'] < geb2['Index']) // happens after
                    .filter(geb2 => geb2['Index'] <= geb['Index'] + 10) // only 10
                    .filter(geb2 => geb2['Text'] === 'in')
                    .forEach(geb2 => minutes[geb2['RelGUID']] += 1)
            }

            if (geb['GebType'] === 50) {
                let minuut = parseInt(geb['Minuut']);
                if (geb['Text'] === 'in') {

                    minutes[geb['RelGUID']] -= minuut;
                    players_on_field.push(geb['RelGUID'])
                } else if (geb['Text'] === 'uit') {
                    minutes[geb['RelGUID']] += minuut;
                    players_on_field = players_on_field.filter(rg => rg !== geb['RelGUID'])
                }
            }
        }
    }

    // If players were not subbed off at the end of the game;
    let last_minute = 10; // TODO: overtime periods
    last_minute += 1;
    for (let guid of players_on_field) {
        minutes[guid] += last_minute
    }

    return minutes
}

function gebeurtenis_data_to_free_throws(gebeurtenis_data) {
    if (gebeurtenis_data === null) {
        return {}
    }
    gebeurtenis_data = gebeurtenis_data['GebNis'] || gebeurtenis_data;
    let result = initialize_per_player(gebeurtenis_data, 0);

    const free_throws = gebeurtenis_data.filter(g => g['GebType'] === 10).filter(g => g['Text'][0] === '1');
    for (let g of free_throws) {
        result[g['RelGUID']] += 1
    }

    return result
}

function gebeurtenis_data_to_free_throws_attempted(gebeurtenis_data) {
    if (gebeurtenis_data === null) {
        return {}
    }

    gebeurtenis_data = gebeurtenis_data['GebNis'] || gebeurtenis_data;
    const n_free_throws_from_geb = x => (Number(x['Text'][1]) || 0);
    const fouls = gebeurtenis_data.filter(x => x['GebType'] === 30);

    return {
        T: fouls.filter(x => x['TofU'] === 'U').map(n_free_throws_from_geb).reduce(sum, 0),
        U: fouls.filter(x => x['TofU'] === 'T').map(n_free_throws_from_geb).reduce(sum, 0)
    };
}

function gebeurtenis_data_to_three_pt(gebeurtenis_data) {
    if (gebeurtenis_data === null) {
        return {}
    }
    gebeurtenis_data = gebeurtenis_data['GebNis'] || gebeurtenis_data;
    let result = initialize_per_player(gebeurtenis_data, 0);

    const three_pt = gebeurtenis_data.filter(g => g['GebType'] === 10).filter(g => g['Text'][0] === '3');
    for (let g of three_pt) {
        result[g['RelGUID']] |= 0;
        result[g['RelGUID']] += 1
    }

    return result
}
