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

