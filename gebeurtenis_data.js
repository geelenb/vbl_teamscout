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

function classify_foul(geb) {
	const text = String(geb?.Text ?? '').trim().toUpperCase().replace(/[()\s]/g, '');
	const category = Number(geb?.FoutCategorie);

	if (/^DI(?:[123])?$/.test(text)) return 'disruptive';
	if (/^FL(?:[123])?$/.test(text)) return 'flagrant';
	if (/^T1/.test(text) || (text.startsWith('T') && category === 1)) return 'technical-category-1';
	if (/^T2/.test(text) || (text.startsWith('T') && category === 2)) return 'technical-category-2';
	if (/^T/.test(text)) return 'technical';
	if (/^U/.test(text)) return 'unsportsmanlike';
	if (/^D/.test(text)) return 'disqualifying';
	if (/^P/.test(text)) return 'personal';
	return 'other';
}

function foul_type_label(geb) {
	return {
		personal: 'Personal foul',
		disruptive: 'Disruptive foul',
		flagrant: 'Flagrant foul',
		'technical-category-1': 'Technical foul (category 1)',
		'technical-category-2': 'Technical foul (category 2)',
		technical: 'Technical foul',
		unsportsmanlike: 'Unsportsmanlike foul (legacy)',
		disqualifying: 'Disqualifying foul (legacy)',
		other: 'Other foul',
	}[classify_foul(geb)];
}

function foul_type_marker(geb) {
	return {
		personal: 'P',
		disruptive: 'DI',
		flagrant: 'FL',
		'technical-category-1': 'T1',
		'technical-category-2': 'T2',
		technical: 'T',
		unsportsmanlike: 'U',
		disqualifying: 'D',
		other: '?',
	}[classify_foul(geb)];
}

function count_fouls_by_type(gebeurtenissen) {
	const counts = {
		personal: 0,
		disruptive: 0,
		flagrant: 0,
		'technical-category-1': 0,
		'technical-category-2': 0,
		technical: 0,
		unsportsmanlike: 0,
		disqualifying: 0,
		other: 0,
	};
	gebeurtenissen
		.filter(geb => geb.GebType === 30 && geb.GebStatus === 10)
		.forEach(geb => counts[classify_foul(geb)]++);
	return counts;
}

function free_throws_awarded_for_foul(geb) {
	if (geb?.GebType !== 30 || geb?.GebStatus !== 10) return 0;
	const type = classify_foul(geb);
	if (type.startsWith('technical')) return 1;

	const text = String(geb.Text ?? '').trim().toUpperCase().replace(/[()\s]/g, '');
	const prefix = {personal: 'P', disruptive: 'DI', flagrant: 'FL', unsportsmanlike: 'U', disqualifying: 'D'}[type];
	const match = prefix && text.match(new RegExp(`^${prefix}([123])$`));
	if (match) return Number(match[1]);
	if (type === 'unsportsmanlike' || type === 'disqualifying') return 2;
	return 0;
}

function foul_summary(gebeurtenissen, box_score_markers = false, single_letter_markers = false) {
	const fouls = gebeurtenissen.filter(geb => geb.GebType === 30 && geb.GebStatus === 10);
	const special_markers = fouls
		.filter(geb => classify_foul(geb) !== 'personal')
		.map(geb => {
			const type = classify_foul(geb);
			if (box_score_markers && type.startsWith('technical')) return 'T';
			if (box_score_markers && type === 'disruptive') return 'D';
			if (box_score_markers && type === 'flagrant') return 'F';
			const marker = foul_type_marker(geb);
			return single_letter_markers ? marker[0] : marker;
		})
		.join('');
	return `${fouls.length}${special_markers ? `<sup>${special_markers}</sup>` : ''}`;
}

function gebeurtenis_data_to_fouls(gebeurtenis_data, single_letter_markers = false) {
	if (gebeurtenis_data === null) {
		return {}
	}
	gebeurtenis_data = gebeurtenis_data['GebNis'] || gebeurtenis_data;
	let fouls = initialize_per_player(gebeurtenis_data, '');

	for (let id in fouls) {
		const player_fouls = gebeurtenis_data.filter(geb =>
			geb.GebType === 30 && geb.GebStatus === 10 && geb.RelGUID === id
		);
		fouls[id] = foul_summary(player_fouls, false, single_letter_markers);
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
			(Math.max(4, geb.Periode) - 1) * 10 +
			(geb.Periode >= 5 ? (geb.Periode - 5) * 5 : 0) + // for games with 2OT or more
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
		const periode_length_in_minutes = this_quarter <= 4 ? 10 : 5;
		const gebs_this_quarter = copy.filter(geb => (geb.Periode === this_quarter));
		const len_this_quarter = Math.max(...gebs_this_quarter.map(geb => geb.index_this_quarter))
		geb.fake_minute = (
			(geb.Periode - 1) * 10 +
			(geb.index_this_quarter / len_this_quarter || 0) * periode_length_in_minutes
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
	const fouls = gebeurtenis_data.filter(x => x['GebType'] === 30 && x['GebStatus'] === 10);

	return {
		T: fouls.filter(x => x['TofU'] === 'U').map(free_throws_awarded_for_foul).reduce(sum, 0),
		U: fouls.filter(x => x['TofU'] === 'T').map(free_throws_awarded_for_foul).reduce(sum, 0)
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
