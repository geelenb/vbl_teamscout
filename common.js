const is_home_game_for_team = (game, team_id) => game['tTGUID'].replace(/\+/g, ' ') === team_id.replace(/\+/g, ' ');

const get_opponent_from_game = (game, own_team_id) =>
    is_home_game_for_team(game, own_team_id) ?
        {
            id: game['tUGUID'],
            id_plus: game['tUGUID'].replace(/ /g, '+'),
            naam: game['tUNaam']
        }
        :
        {
            id: game['tTGUID'],
            id_plus: game['tTGUID'].replace(/ /g, '+'),
            naam: game['tTNaam']
        };


const get_relevant_part_from_game_data = (game_data, home) => home ? game_data['TtDeel'] : game_data['TuDeel'];


const sum = (a, b) => a + b;



const _corner_annotation = {
    xref: 'paper',
    yref: 'paper',
    showarrow: false,                
};

const _left_annotation = {
        x: 0,
        xanchor: 'left',
};
const _right_annotation = {
        x: 1,
        xanchor: 'right',
};
const _top_annotation = {
        y: 1,
        yanchor: 'top',
};
const _bottom_annotation = {
        y: 0,
        yanchor: 'bottom',
};

const corner_annotations = [
    {
        ..._corner_annotation,
        ..._left_annotation,
        ..._bottom_annotation,
        text: 'Only opponent scores (worst)',
    }, {
        ..._corner_annotation,
        ..._right_annotation,
        ..._top_annotation,
        text: 'Only we score (best)',
    }, {
        ..._corner_annotation,
        ..._left_annotation,
        ..._top_annotation,
        text: 'No teams score',
    }, {
        ..._corner_annotation,
        ..._right_annotation,
        ..._bottom_annotation,
        text: 'Both teams score',
    }
];