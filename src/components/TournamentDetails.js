// frontend/src/components/TournamentDetails.js
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../axios';
import BracketRenderer from './BracketRenderer';
import './Home.css';

function TournamentDetails() {
    const { id } = useParams();
    const [tournament, setTournament] = useState(null);
    const [user, setUser] = useState(null);
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [newTeamName, setNewTeamName] = useState('');
    const [message, setMessage] = useState('');
    const [isParticipating, setIsParticipating] = useState(false);
    const [addParticipantName, setAddParticipantName] = useState('');
    const [adminRequestStatus, setAdminRequestStatus] = useState(null);
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [inviteMethod, setInviteMethod] = useState('username');
    const [inviteUsername, setInviteUsername] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedWinnerId, setSelectedWinnerId] = useState(null);
    const [thirdPlaceMatch, setThirdPlaceMatch] = useState(false);
    const [matchScores, setMatchScores] = useState({ team1: 0, team2: 0 });

    // Загрузка данных
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api
                .get('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
                .then((userResponse) => {
                    setUser(userResponse.data);
                    api
                        .get(`/api/teams?userId=${userResponse.data.id}`, { headers: { Authorization: `Bearer ${token}` } })
                        .then((res) => setTeams(res.data || []))
                        .catch((error) => console.error('Ошибка загрузки команд:', error));
                })
                .catch((error) => console.error('Ошибка загрузки пользователя:', error));
        }

        const fetchTournament = async () => {
            try {
                const tournamentResponse = await api.get(`/api/tournaments/${id}`);
                console.log('Данные турнира при загрузке:', tournamentResponse.data);
                setTournament(tournamentResponse.data);
                const loadedMatches = Array.isArray(tournamentResponse.data.matches) ? tournamentResponse.data.matches : [];
                setMatches(loadedMatches);
            } catch (error) {
                console.error('Ошибка загрузки турнира:', error);
            }
        };
        fetchTournament();
    }, [id]);

    useEffect(() => {
        if (tournament && user) {
            const participants = tournament.participants || [];
            const participating = participants.some(
                (p) =>
                    (tournament.participant_type === 'solo' && p.user_id === user.id) ||
                    (tournament.participant_type === 'team' && p.creator_id === user.id)
            );
            setIsParticipating(participating);

            if (localStorage.getItem('token')) {
                api
                    .get(`/api/tournaments/${id}/admin-request-status`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    })
                    .then((statusResponse) => setAdminRequestStatus(statusResponse.data.status))
                    .catch((error) => console.error('Ошибка загрузки статуса администратора:', error));
            }
        }
    }, [tournament, user, id]);

    const getRoundName = (round, totalRounds) => {
        if (round === -1) return 'Предварительный раунд';
        const roundsLeft = totalRounds - round - 1;
        if (roundsLeft === 0) return 'Финал';
        if (roundsLeft === 1) return 'Полуфинал';
        if (roundsLeft === 2) return 'Четвертьфинал';
        const stage = Math.pow(2, roundsLeft + 1);
        return `1/${stage} финала`;
    };

    const games = useMemo(() => {
        if (!tournament || !Array.isArray(matches)) return [];

        const participantCount = tournament.participants?.length || 0;
        const totalRounds = Math.ceil(Math.log2(participantCount));

        return matches.map((match) => {
            const homeParticipant = match.team1_id
                ? (tournament.participants || []).find((p) => p.id === match.team1_id)
                : null;
            const visitorParticipant = match.team2_id
                ? (tournament.participants || []).find((p) => p.id === match.team2_id)
                : null;

            return {
                id: match.id.toString(),
                name: match.is_third_place_match ? 'Матч за 3-е место' : `Match ${match.match_number}`,
                tournamentRoundText: match.is_third_place_match
                    ? 'Матч за 3-е место'
                    : getRoundName(match.round, totalRounds),
                startTime: match.scheduled ? new Date(match.scheduled).toISOString() : new Date().toISOString(),
                state: match.winner_team_id ? 'DONE' : 'NO_PARTY',
                participants: [
                    {
                        id: match.team1_id ? match.team1_id.toString() : null,
                        name: homeParticipant ? homeParticipant.name : 'TBD',
                        isWinner: match.winner_team_id === match.team1_id,
                        score: match.score1 || 0,
                        resultText: null,
                        status: null,
                    },
                    {
                        id: match.team2_id ? match.team2_id.toString() : null,
                        name: visitorParticipant ? visitorParticipant.name : 'TBD',
                        isWinner: match.winner_team_id === match.team2_id,
                        score: match.score2 || 0,
                        resultText: null,
                        status: null,
                    },
                ],
                nextMatchId: match.next_match_id ? match.next_match_id.toString() : null,
                is_third_place_match: match.is_third_place_match || false,
                bracket_type: match.bracket_type,
                round: match.round,
            };
        });
    }, [matches, tournament]);

    const handleParticipate = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage('Пожалуйста, войдите, чтобы участвовать');
            return;
        }

        try {
            const payload =
                tournament.participant_type === 'solo'
                    ? {}
                    : { teamId: selectedTeam || null, newTeamName: selectedTeam ? null : newTeamName };
            const participateResponse = await api.post(`/api/tournaments/${id}/participate`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage(participateResponse.data.message);
            const updatedTournament = await api.get(`/api/tournaments/${id}`);
            setTournament(updatedTournament.data);
            setMatches(updatedTournament.data.matches || []);
            setIsParticipating(true);
            setNewTeamName('');
        } catch (error) {
            setMessage(error.response?.data?.error || 'Ошибка при регистрации');
        }
    };

    const handleWithdraw = async () => {
        const token = localStorage.getItem('token');
        try {
            const withdrawResponse = await api.post(
                `/api/tournaments/${id}/withdraw`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(withdrawResponse.data.message);
            const updatedTournament = await api.get(`/api/tournaments/${id}`);
            setTournament(updatedTournament.data);
            setMatches(updatedTournament.data.matches || []);
            setIsParticipating(false);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Ошибка при отказе');
        }
    };

    const handleAddParticipant = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage('Пожалуйста, войдите, чтобы добавить участника');
            return;
        }

        try {
            const addParticipantResponse = await api.post(
                `/api/tournaments/${id}/add-participant`,
                { participantName: addParticipantName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(addParticipantResponse.data.message);
            const updatedTournament = await api.get(`/api/tournaments/${id}`);
            setTournament(updatedTournament.data);
            setMatches(updatedTournament.data.matches || []);
            setAddParticipantName('');
        } catch (error) {
            setMessage(error.response?.data?.error || 'Ошибка при добавлении участника');
        }
    };

    const handleRequestAdmin = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage('Пожалуйста, войдите, чтобы запросить права администратора');
            return;
        }

        try {
            const requestAdminResponse = await api.post(
                `/api/tournaments/${id}/request-admin`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(requestAdminResponse.data.message);
            setAdminRequestStatus('pending');
        } catch (error) {
            setMessage(error.response?.data?.error || 'Ошибка при запросе прав администратора');
        }
    };

    const handleGenerateBracket = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage('Пожалуйста, войдите, чтобы сгенерировать сетку');
            return;
        }

        if (!canGenerateBracket) {
            setMessage('У вас нет прав для генерации сетки или сетка уже сгенерирована');
            return;
        }

        try {
            const generateBracketResponse = await api.post(
                `/api/tournaments/${id}/generate-bracket`,
                { thirdPlaceMatch: tournament.format === 'double_elimination' ? true : thirdPlaceMatch },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(generateBracketResponse.data.message);
            const updatedTournament = await api.get(`/api/tournaments/${id}`);
            setTournament(updatedTournament.data);
            setMatches(updatedTournament.data.matches || []);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Ошибка при генерации сетки');
        }
    };

    const handleUpdateMatch = async (updatedMatch) => {
        const { matchId, winner_team_id, score1, score2 } = updatedMatch;
        const token = localStorage.getItem('token');

        try {
            const updateMatchResponse = await api.post(
                `/api/tournaments/${id}/update-match`,
                { matchId, winner_team_id, score1, score2 },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Ответ сервера:', updateMatchResponse.data);
            console.log('matches в ответе:', updateMatchResponse.data.tournament.matches);
            console.log('participants в ответе:', updateMatchResponse.data.tournament.participants);
            setMessage(updateMatchResponse.data.message);

            let updatedMatches = Array.isArray(updateMatchResponse.data.tournament.matches)
                ? updateMatchResponse.data.tournament.matches
                : [];

            let updatedTournamentResponse;
            if (updatedMatches.length === 0) {
                console.log('matches пустой, запрашиваем данные заново');
                updatedTournamentResponse = await api.get(`/api/tournaments/${id}`);
                console.log('Синхронизированные данные:', updatedTournamentResponse.data);
                updatedMatches = Array.isArray(updatedTournamentResponse.data.matches)
                    ? updatedTournamentResponse.data.matches
                    : [];
                console.log('Синхронизированные матчи:', updatedMatches);
            }

            setMatches(updatedMatches);

            const newParticipants = updatedTournamentResponse && Array.isArray(updatedTournamentResponse.data.participants)
                ? updatedTournamentResponse.data.participants
                : (Array.isArray(updateMatchResponse.data.tournament.participants) && updateMatchResponse.data.tournament.participants.length > 0
                    ? updateMatchResponse.data.tournament.participants
                    : (tournament?.participants || []));

            const updatedTournament = {
                ...updateMatchResponse.data.tournament,
                participants: newParticipants
            };
            console.log('Обновлённый турнир:', updatedTournament);
            setTournament(updatedTournament);

            setSelectedMatch(null);
            setShowConfirmModal(false);
            setMatchScores({ team1: 0, team2: 0 });
        } catch (error) {
            console.error('Ошибка от сервера:', error.response?.data);
            const errorMessage = error.response?.data?.error || 'Ошибка при обновлении результата';
            setMessage(errorMessage);

            try {
                const syncTournamentResponse = await api.get(`/api/tournaments/${id}`);
                console.log('Синхронизированные данные:', syncTournamentResponse.data);

                const syncedMatches = Array.isArray(syncTournamentResponse.data.matches)
                    ? syncTournamentResponse.data.matches
                    : [];
                console.log('Синхронизированные матчи:', syncedMatches);
                setMatches(syncedMatches);

                const updatedTournament = {
                    ...syncTournamentResponse.data,
                    participants: Array.isArray(syncTournamentResponse.data.participants)
                        ? syncTournamentResponse.data.participants
                        : (tournament?.participants || [])
                };
                console.log('Синхронизированный турнир:', updatedTournament);
                setTournament(updatedTournament);
                setMessage('Данные синхронизированы, но произошла ошибка: ' + errorMessage);
            } catch (fetchError) {
                console.error('Ошибка при синхронизации данных:', fetchError);
                setMessage('Ошибка при синхронизации данных: ' + fetchError.message);
            }

            setSelectedMatch(null);
            setShowConfirmModal(false);
            setMatchScores({ team1: 0, team2: 0 });
        }
    };

    const handleCloseModal = () => {
        setShowConfirmModal(false);
        setSelectedMatch(null);
        setSelectedWinnerId(null);
        setMatchScores({ team1: 0, team2: 0 });
    };

    const handleConfirmWinner = (action) => {
        if (action === 'yes' && selectedMatch && selectedWinnerId) {
            const updatedMatch = {
                matchId: Number(selectedMatch),
                winner_team_id: Number(selectedWinnerId),
                score1: matchScores.team1,
                score2: matchScores.team2,
            };
            handleUpdateMatch(updatedMatch);
        }
        handleCloseModal();
    };

    const handleTeamClick = (teamId, matchId) => {
        if (!teamId || !matchId) return;
        const match = matches.find((m) => m.id === parseInt(matchId));
        if (match && match.winner_team_id) return;
        setSelectedMatch(matchId);
        setSelectedWinnerId(teamId);
        setShowConfirmModal(true);
    };

    const handleInvite = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage('Пожалуйста, войдите, чтобы отправить приглашение');
            return;
        }
        try {
            const payload =
                inviteMethod === 'username' ? { username: inviteUsername } : { email: inviteEmail };
            const inviteResponse = await api.post(`/api/tournaments/${id}/invite`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage(inviteResponse.data.message);
            setInviteUsername('');
            setInviteEmail('');
        } catch (error) {
            setMessage(error.response?.data?.error || 'Ошибка при отправке приглашения');
        }
    };

    if (!tournament) return <p>Загрузка...</p>;

    const isCreator = user && tournament.created_by === user.id;
    const canRequestAdmin = user && !isCreator && !adminRequestStatus;
    const canGenerateBracket = user && (isCreator || adminRequestStatus === 'accepted') && matches.length === 0;
    const canEditMatches = user && (isCreator || adminRequestStatus === 'accepted');

    // Определение призёров
    let winners = [];
    if (Array.isArray(matches) && matches.length > 0) {
        if (tournament.format === 'double_elimination') {
            // Для Double Elimination
            // Находим Grand Final (матч с bracket_type = 'grand_final')
            const grandFinalMatch = matches.find((m) => m.bracket_type === 'grand_final');
            if (grandFinalMatch && grandFinalMatch.winner_team_id) {
                const firstPlace = (tournament.participants || []).find((p) => p.id === grandFinalMatch.winner_team_id)?.name || '';
                const secondPlace = (tournament.participants || []).find(
                    (p) =>
                        p.id !== grandFinalMatch.winner_team_id &&
                        (p.id === grandFinalMatch.team1_id || p.id === grandFinalMatch.team2_id)
                )?.name || '';
                winners = [[1, firstPlace], [2, secondPlace]];

                // Находим финал нижней сетки (Losers Bracket Final) — последний матч с bracket_type = 'loser' перед Grand Final
                const loserMatches = matches.filter((m) => m.bracket_type === 'loser');
                const maxLoserRound = Math.max(...loserMatches.map((m) => m.round));
                const loserFinalMatch = loserMatches.find((m) => m.round === maxLoserRound);

                if (loserFinalMatch && loserFinalMatch.winner_team_id) {
                    const thirdPlace = (tournament.participants || []).find(
                        (p) =>
                            p.id !== loserFinalMatch.winner_team_id &&
                            (p.id === loserFinalMatch.team1_id || p.id === loserFinalMatch.team2_id)
                    )?.name || '';
                    winners.push([3, thirdPlace]);
                }
            }
        } else {
            // Для Single Elimination (старая логика)
            let finalMatch = null;
            const rounds = matches.map((m) => m.round);
            const maxRound = rounds.length > 0 ? Math.max(...rounds) : -1;
            if (maxRound !== -1) {
                const relevantMatches = matches.filter(
                    (m) => m.round === maxRound && !m.is_third_place_match
                );
                const matchNumbers = relevantMatches.map((m) => m.match_number);
                const maxMatchNumber = matchNumbers.length > 0 ? Math.max(...matchNumbers) : -1;
                if (maxMatchNumber !== -1) {
                    finalMatch = relevantMatches.find(
                        (m) => m.match_number === maxMatchNumber
                    );
                }
            }

            if (finalMatch && finalMatch.winner_team_id) {
                const firstPlace = (tournament.participants || []).find((p) => p.id === finalMatch.winner_team_id)?.name || '';
                const secondPlace = (tournament.participants || []).find(
                    (p) =>
                        p.id !== finalMatch.winner_team_id &&
                        (p.id === finalMatch.team1_id || p.id === finalMatch.team2_id)
                )?.name || '';
                winners = [[1, firstPlace], [2, secondPlace]];

                if (tournament.format === 'single_elimination' && thirdPlaceMatch) {
                    const thirdPlaceMatchResult = matches.find((m) => m.is_third_place_match);
                    const thirdPlace = thirdPlaceMatchResult?.winner_team_id
                        ? (tournament.participants || []).find((p) => p.id === thirdPlaceMatchResult.winner_team_id)?.name
                        : '';
                    if (thirdPlace) winners.push([3, thirdPlace]);
                }
            }
        }
    }

    return (
        <section className="tournament-details">
            <h2>
                {tournament.name} ({tournament.status === 'active' ? 'Активен' : 'Завершён'})
            </h2>
            <p>
                <strong>Описание:</strong> {tournament.description || 'Нет описания'}
            </p>
            <p>
                <strong>Формат:</strong> {tournament.format}
            </p>
            <p>
                <strong>Дата старта:</strong> {new Date(tournament.start_date).toLocaleDateString('ru-RU')}
            </p>
            {tournament.end_date && (
                <p>
                    <strong>Дата окончания:</strong>{' '}
                    {new Date(tournament.end_date).toLocaleDateString('ru-RU')}
                </p>
            )}
            <p>
                <strong>Участники ({tournament.participant_count || 0}):</strong>
            </p>
            <ul>
                {(Array.isArray(tournament.participants) ? tournament.participants : []).map((participant) => (
                    <li key={participant.id}>{participant.name || `Участник ${participant.id}`}</li>
                ))}
            </ul>
            {user && tournament.status === 'active' && (
                <div className="participation-controls">
                    {!isParticipating && matches.length === 0 ? (
                        <>
                            {tournament.participant_type === 'team' && (
                                <div className="team-selection">
                                    <label>Выберите команду или создайте новую:</label>
                                    <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                                        <option value="">Создать новую команду</option>
                                        {(teams || []).map((team) => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                    {!selectedTeam && (
                                        <input
                                            type="text"
                                            placeholder="Название новой команды"
                                            value={newTeamName}
                                            onChange={(e) => setNewTeamName(e.target.value)}
                                        />
                                    )}
                                </div>
                            )}
                            <button onClick={handleParticipate}>Участвовать в турнире</button>
                        </>
                    ) : (
                        isParticipating &&
                        matches.length === 0 && (
                            <button onClick={handleWithdraw}>Отказаться от участия</button>
                        )
                    )}
                    {isCreator && matches.length === 0 && (
                        <div className="invite-participant">
                            <h3>Выслать приглашение на турнир</h3>
                            <select value={inviteMethod} onChange={(e) => setInviteMethod(e.target.value)}>
                                <option value="username">По никнейму</option>
                                <option value="email">По email</option>
                            </select>
                            {inviteMethod === 'username' ? (
                                <input
                                    type="text"
                                    placeholder="Никнейм пользователя"
                                    value={inviteUsername}
                                    onChange={(e) => {
                                        setInviteUsername(e.target.value);
                                        setInviteEmail('');
                                    }}
                                />
                            ) : (
                                <input
                                    type="email"
                                    placeholder="Email пользователя"
                                    value={inviteEmail}
                                    onChange={(e) => {
                                        setInviteEmail(e.target.value);
                                        setInviteUsername('');
                                    }}
                                />
                            )}
                            <button onClick={handleInvite}>Пригласить</button>
                        </div>
                    )}
                    {(isCreator || adminRequestStatus === 'accepted') && matches.length === 0 && (
                        <div className="add-participant">
                            <h3>Добавить неавторизованного участника</h3>
                            <input
                                type="text"
                                placeholder="Имя участника"
                                value={addParticipantName}
                                onChange={(e) => setAddParticipantName(e.target.value)}
                            />
                            <button onClick={handleAddParticipant}>Добавить</button>
                        </div>
                    )}
                    {canRequestAdmin && (
                        <button onClick={handleRequestAdmin}>Администрировать турнир</button>
                    )}
                    {canGenerateBracket && (
                        <div>
                            {tournament.format === 'single_elimination' && (
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={thirdPlaceMatch}
                                        onChange={(e) => setThirdPlaceMatch(e.target.checked)}
                                    />{' '}
                                    Нужен матч за третье место?
                                </label>
                            )}
                            <button onClick={handleGenerateBracket}>Сгенерировать сетку</button>
                        </div>
                    )}
                </div>
            )}
            <h3>Турнирная сетка</h3>
            {matches.length > 0 ? (
                <div className="custom-tournament-bracket">
                    <BracketRenderer
                        games={games}
                        canEditMatches={canEditMatches}
                        selectedMatch={selectedMatch}
                        setSelectedMatch={setSelectedMatch}
                        handleTeamClick={handleTeamClick}
                        format={tournament.format}
                    />
                </div>
            ) : (
                <p>Сетка ещё не сгенерирована</p>
            )}
            {winners.length > 0 && (
                <div className="winners-list">
                    <h3>Призёры турнира</h3>
                    <ul>
                        {winners.map(([place, name]) => (
                            <li key={place}>
                                {place} место: {name || 'Не определён'}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {showConfirmModal && selectedMatch && (
                <div className="modal" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Подтверждение победителя</h3>
                        <p>
                            Победитель:{' '}
                            <span className="winner-name">
                                {games
                                    ?.find((m) => m.id === selectedMatch.toString())
                                    ?.participants.find((p) => p.id === selectedWinnerId)?.name || 'Не определён'}
                            </span>
                        </p>
                        <div className="score-inputs">
                            <div className="score-container">
                                <span className="participant-name">
                                    {games?.find((m) => m.id === selectedMatch.toString())?.participants[0]?.name ||
                                        'Участник 1'}
                                </span>
                                <input
                                    type="number"
                                    value={matchScores.team1}
                                    onChange={(e) => setMatchScores({ ...matchScores, team1: Number(e.target.value) })}
                                    className="score-input"
                                    min="0"
                                />
                            </div>
                            <div className="score-container">
                                <span className="participant-name">
                                    {games?.find((m) => m.id === selectedMatch.toString())?.participants[1]?.name ||
                                        'Участник 2'}
                                </span>
                                <input
                                    type="number"
                                    value={matchScores.team2}
                                    onChange={(e) => setMatchScores({ ...matchScores, team2: Number(e.target.value) })}
                                    className="score-input"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={() => handleConfirmWinner('yes')}>Подтвердить</button>
                            <button onClick={handleCloseModal}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}
            {message && (
                <p className={message.includes('успешно') ? 'success' : 'error'}>{message}</p>
            )}
        </section>
    );
}

export default TournamentDetails;