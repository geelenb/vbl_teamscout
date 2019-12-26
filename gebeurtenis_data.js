function gebeurtenis_data_to_points(gebeurtenis_data) {
    let points = {
        T: {},
        U: {}
    };
    if (gebeurtenis_data === null) {
        return points
    }
    gebeurtenis_data['GebNis'].forEach(gebeurtenis => {
        if ((gebeurtenis['GebType'] === 50)) {
            // Set to zero when they played in the game
            points[gebeurtenis['TofU']][gebeurtenis['RelGUID']] |= 0;
        }
        if (gebeurtenis['GebType'] === 10) {
            points[gebeurtenis['TofU']][gebeurtenis['RelGUID']] |= 0; // some games don't record in/uit
            points[gebeurtenis['TofU']][gebeurtenis['RelGUID']] += parseInt(gebeurtenis['Text'].split(' ')[0]);
        }
    });
    return points
}

function gebeurtenis_data_to_plus_minus(gebeurtenis_data) {
    let plus_minus = {
        T: {},
        U: {}
    };
    if (gebeurtenis_data === null) {
        return plus_minus
    }

    let players_on_field = {
        T: [],
        U: []
    };

    for (let gebeurtenis of gebeurtenis_data['GebNis']) {
        if (gebeurtenis['GebType'] === 50) {
            // wissel
            if (gebeurtenis['Text'] === 'in') {
                plus_minus[gebeurtenis['TofU']][gebeurtenis['RelGUID']] |= 0;
                players_on_field[gebeurtenis['TofU']].push(gebeurtenis['RelGUID'])
            } else if (gebeurtenis['Text'] === 'uit') {
                players_on_field[gebeurtenis['TofU']] = (
                    players_on_field[gebeurtenis['TofU']].filter(v => v !== gebeurtenis['RelGUID'])
                )
            }
        } else if (gebeurtenis['GebType'] === 10) {
            // score
            let punten = Number(gebeurtenis['Text'].split(' ')[0]);
            if (gebeurtenis['TofU'] === 'U') {
                punten = -punten
            }
            for (let player of players_on_field.T) {
                plus_minus.T[player] += punten
            }
            for (let player of players_on_field.U) {
                plus_minus.U[player] -= punten
            }
        }
    }
    return plus_minus
}

function gebeurtenis_data_to_fouls(gebeurtenis_data) {
    let fouls = {
        T: {},
        U: {}
    };
    if (gebeurtenis_data === null) {
        return fouls
    }

    for (let geb of gebeurtenis_data['GebNis']) {
        if (geb['GebType'] === 30 && geb['GebStatus'] === 10) {
            if (!(fouls[geb['TofU']][geb['RelGUID']])) {
                fouls[geb['TofU']][geb['RelGUID']] = ''
            }

            fouls[geb['TofU']][geb['RelGUID']] += geb['Text'][0]
        }
    }
    const f = foul_str => `${foul_str.length}<sup>${Array.from(foul_str).filter(p => p != 'P').join('')}</sup>`;

    for (let id in fouls.T) {
        fouls.T[id] = f(fouls.T[id])
    }
    for (let id in fouls.U) {
        fouls.U[id] = f(fouls.U[id])
    }

    return fouls
}

function gebeurtenis_data_to_minutes(gebeurtenis_data) {
    let minutes = {
        T: {},
        U: {}
    };

    let players_on_field = {
        T: [],
        U: []
    };
    if (gebeurtenis_data === null) {
        return minutes
    }

    // Add counter for every player that played
    gebeurtenis_data['GebNis']
        .filter(geb => geb['GebType'] === 50)
        .forEach(geb => minutes[geb['TofU']][geb['RelGUID']] = 0);

    for (let geb of gebeurtenis_data['GebNis']) {
        let quarter_start = 0;
        if (geb['GebStatus'] === 10) {
            if (geb['GebType'] === 40) {
                // quarter changes

                // next 10 in's get .5 for free to ajust for counting the minutes 1-10
                // gebeurtenis_data
                // ['GebNis']
                // .filter(geb2 => geb['Index'] < geb2.Index) // happens after
                // .filter(geb2 => geb2.Index <= geb['Index'] + 10) // only 10
                // .filter(geb2 => geb2.Text === 'in')
                // .forEach(geb2 => minutes[geb2.TofU][geb2.RelGUID] += .5)

                // last 10 uit's get .5 for free as well
                gebeurtenis_data
                    ['GebNis']
                    .filter(geb2 => geb['Index'] < geb2['Index']) // happens after
                    .filter(geb2 => geb2['Index'] <= geb['Index'] + 10) // only 10
                    .filter(geb2 => geb2['Text'] === 'in')
                    .forEach(geb2 => minutes[geb2['TofU']][geb2['RelGUID']] += 1)
            }

            if (geb['GebType'] === 50) {
                let minuut = parseInt(geb['Minuut']);
                if (geb['Text'] === 'in') {

                    minutes[geb['TofU']][geb['RelGUID']] -= minuut;
                    players_on_field[geb['TofU']].push(geb['RelGUID'])
                } else if (geb['Text'] === 'uit') {
                    minutes[geb['TofU']][geb['RelGUID']] += minuut;
                    players_on_field[geb['TofU']] = players_on_field[geb['TofU']].filter(rg => rg !== geb['RelGUID'])
                }
            }
        }
    }

    // If players were not subbed off at the end of the game;
    let last_minute = 10; // TODO: overtime periods
    last_minute += 1;
    for (let team of ['T', 'U']) {
        for (let guid of players_on_field[team]) {
            minutes[team][guid] += last_minute
        }
    }

    return minutes
}

function gebeurtenis_data_to_free_throws(gebeurtenis_data) {
    let result = {
        U: {},
        T: {}
    };
    if (gebeurtenis_data === null) {
        return result
    }

    const free_throws = gebeurtenis_data['GebNis'].filter(g => g['GebType'] === 10).filter(g => g.Text[0] === '1');
    for (let g of free_throws) {
        result[g.TofU][g.RelGUID] |= 0;
        result[g.TofU][g.RelGUID] += 1
    }

    return result
}

function gebeurtenis_data_to_three_pt(gebeurtenis_data) {
    let result = {
        U: {},
        T: {}
    };
    if (gebeurtenis_data === null) {
        return result
    }

    const free_throws = gebeurtenis_data['GebNis'].filter(g => g['GebType'] === 10).filter(g => g.Text[0] === '3');
    for (let g of free_throws) {
        result[g.TofU][g.RelGUID] |= 0;
        result[g.TofU][g.RelGUID] += 1
    }

    return result
}
