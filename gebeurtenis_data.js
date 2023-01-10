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

	let players_on_field = {T: [], U: []};

	gebeurtenis_data.forEach(geb => {
		if (geb.GebStatus !== 10) {
			return;
		}

		if (geb['GebType'] === 50) {
			// wissel
			if (geb['Text'] === 'in') {
				players_on_field[geb.TofU].push(geb['RelGUID']);
			} else if (geb['Text'] === 'uit') {
				players_on_field.T = players_on_field.T.filter(v => v !== geb['RelGUID']);
				players_on_field.U = players_on_field.U.filter(v => v !== geb['RelGUID']);
			}
		} else if (geb['GebType'] === 10) {
			// score
			let punten = Number(geb['Text'].split(' ')[0]);
			if (geb['TofU'] === 'U') {
				punten = -punten;
			}
			for (let player of players_on_field.T) {
				plus_minus[player] += punten
			}
			for (let player of players_on_field.U) {
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

function add_detailed_minute_to_gebnis(gebnis) {
	const copy = [].concat(gebnis.map(geb => ({...geb})));
	copy.forEach((geb, i) => {
		if (i === 0) {
			geb.index_this_minute = 0;
			return;
		}

		const prev = copy[i - 1];
		if (geb.Minuut !== prev.Minuut) {
			geb.index_this_minute = 0;
			return;
		}

		if (geb.GebStatus !== 10) {
			geb.index_this_minute = prev.index_this_minute;
			return
		}

		if (geb.GebType === 50 && ![10, 30].includes(prev.GebType)) {
			// wissel, and previous was not a score, foul
			geb.index_this_minute = prev.index_this_minute;
			return;
		}

		geb.index_this_minute = 1 + prev.index_this_minute;
	})

	copy.forEach((geb, i) => {
		const this_quarter = geb.Periode;
		const this_minute = geb.Minuut;
		const gebs_this_minute = copy.filter(geb => (geb.Periode == this_quarter) && (geb.Minuut == this_minute));
		let len_this_minute = Math.max(...gebs_this_minute.map(geb => geb.index_this_minute))
		if (this_minute !== 10) {
			len_this_minute += 1;
		}
		geb.detailed_minute = (
			(geb.Periode - 1) * 10 +
			(geb.Minuut - 1) +
			(geb.index_this_minute / len_this_minute || 0)
		);
	})

	return copy;
}


function add_fake_minute_to_gebnis(gebnis) {
	const copy = [].concat(gebnis.map(geb => ({...geb})));
	copy.forEach((geb, i) => {
		if (i === 0) {
			geb.index_this_quarter = 0;
			return;
		}

		const prev = copy[i - 1];
		if (geb.Periode !== prev.Periode) {
			geb.index_this_quarter = 0;
			return;
		}

		if (geb.GebStatus !== 10) {
			// Foutieve gebeurtenis
			geb.index_this_quarter = prev.index_this_quarter;
			return
		}

		if (geb.GebType === 50 && ![30].includes(prev.GebType)) {
			// if wissel and previous was not in {foul}
			geb.index_this_quarter = prev.index_this_quarter;
			return;
		}

		if (geb.GebType === 40) {
			// Details at the beginning of quarters
			geb.index_this_quarter = prev.index_this_quarter;
			return;
		}

		geb.index_this_quarter = 1 + prev.index_this_quarter;
	})

	copy.forEach((geb, i) => {
		const this_quarter = geb.Periode;
		const gebs_this_quarter = copy.filter(geb => (geb.Periode == this_quarter));
		let len_this_quarter = Math.max(...gebs_this_quarter.map(geb => geb.index_this_quarter))
		geb.fake_minute = (
			(geb.Periode - 1) * 10 +
			(geb.index_this_quarter / len_this_quarter || 0) * 10
		);
		if (geb.GebType === 60) {
			geb.fake_minute = copy[i-1].fake_minute
		}
	})

	return copy;
}

function minutes_for_player(gebeurtenis_data, player_relguid) {
	let on = false;
	let minutes = 0;

	// const gebnis = add_detailed_minute_to_gebnis(gebeurtenis_data['GebNis'] || gebeurtenis_data);
	const gebnis = gebeurtenis_data['GebNis'] || gebeurtenis_data;

	gebnis.forEach((geb) => {
		if (geb.GebStatus !== 10) {
			return;
		}
		if (geb.RelGUID !== player_relguid) {
			return;
		}

		if (geb.Text === 'in') {
			on = true;
			minutes -= geb.fake_minute;
		}

		if (geb.Text === 'uit') {
			on = false;
			minutes += geb.fake_minute;
		}
	});
	if (on) {
		const copy = [].concat(gebnis)
		copy.reverse();
		const last_geb = copy.find(geb => geb.Periode < 99);
		minutes += last_geb.fake_minute;
	}
	return minutes;
}


function gebeurtenis_data_to_minutes(gebeurtenis_data) {
	if (gebeurtenis_data === null) {
		return {}
	}
	let minutes = initialize_per_player(gebeurtenis_data, 0);

	Object.keys(minutes).forEach(relguid => minutes[relguid] = Math.round(minutes_for_player(gebeurtenis_data, relguid)))

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
