// frontend/src/components/BracketRenderer.js
import React from 'react';
import './Home.css';

const BracketRenderer = ({
    games,
    canEditMatches,
    selectedMatch,
    setSelectedMatch,
    handleTeamClick,
    format
}) => {
    // Группировка матчей по раундам и сеткам
    const groupMatchesByRoundAndBracket = () => {
        const winnerMatches = games.filter(
            (m) => m.bracket_type === 'winner' || m.bracket_type === 'prelim'
        );
        const loserMatches = games.filter((m) => m.bracket_type === 'loser');
        const placementMatch = games.find((m) => m.bracket_type === 'placement');
        const grandFinalMatch = games.find((m) => m.bracket_type === 'grand_final');

        // Определяем максимальный раунд для верхней и нижней сетки
        const maxWinnerRound = Math.max(...winnerMatches.map(m => m.round), 0);
        const maxLoserRound = Math.max(...loserMatches.map(m => m.round), 0);

        // Группировка верхней сетки по раундам (начиная с round = 0)
        const winnerRounds = [];
        for (let round = 0; round <= maxWinnerRound; round++) {
            winnerRounds[round] = winnerMatches.filter(m => m.round === round);
        }

        // Группировка нижней сетки по раундам (начиная с round = 1)
        const loserRounds = [];
        for (let round = 1; round <= maxLoserRound; round++) {
            loserRounds[round] = loserMatches.filter(m => m.round === round);
        }

        return { winnerRounds, loserRounds, placementMatch, grandFinalMatch };
    };

    const { winnerRounds, loserRounds, placementMatch, grandFinalMatch } = groupMatchesByRoundAndBracket();

    return (
        <div className="tournament-bracket">
            {/* Верхняя сетка (Winners Bracket) */}
            <div className="bracket winners-bracket">
                <h2>Winners Bracket</h2>
                <div className="bracket-grid">
                    {Object.keys(winnerRounds).map((round) => {
                        const roundMatches = winnerRounds[round];
                        return (
                            <div key={round} className="round-column">
                                {/* Для Single Elimination отображаем "Preliminary (Round 0)" для round = 0, для Double Elimination просто "Round 0" */}
                                <h3>
                                    {format === 'single_elimination' && round === '0'
                                        ? 'Preliminary (Round 0)'
                                        : `Round ${round}`}
                                </h3>
                                {roundMatches.map((match) => {
                                    const isSelected = selectedMatch === parseInt(match.id);
                                    return (
                                        <div
                                            key={match.id}
                                            className={`custom-seed ${isSelected ? 'selected' : ''}`}
                                            onClick={() =>
                                                canEditMatches &&
                                                match.state !== 'DONE' &&
                                                setSelectedMatch(isSelected ? null : parseInt(match.id))
                                            }
                                        >
                                            <div className="match-number">{match.name}</div>
                                            <div className="match-teams">
                                                <div
                                                    className={`team ${match.participants[0].isWinner ? 'winner' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTeamClick(match.participants[0].id, match.id);
                                                    }}
                                                >
                                                    <span className="team-name">{match.participants[0].name.slice(0, 20)}</span>
                                                    <span className="team-score">
                                                        {match.participants[0].score > 0 ? match.participants[0].score : '-'}
                                                    </span>
                                                </div>
                                                <div
                                                    className={`team ${match.participants[1].isWinner ? 'winner' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTeamClick(match.participants[1].id, match.id);
                                                    }}
                                                >
                                                    <span className="team-name">{match.participants[1].name.slice(0, 20)}</span>
                                                    <span className="team-score">
                                                        {match.participants[1].score > 0 ? match.participants[1].score : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Разделительная граница и нижняя сетка (только для Double Elimination) */}
            {format === 'double_elimination' && (
                <>
                    <hr className="bracket-divider" />
                    <div className="bracket losers-bracket">
                        <h2>Losers Bracket</h2>
                        <div className="bracket-grid">
                            {Object.keys(loserRounds).map((round) => {
                                const roundMatches = loserRounds[round];
                                return roundMatches.length > 0 ? (
                                    <div key={round} className="round-column">
                                        <h3>Round {round}</h3>
                                        {roundMatches.map((match) => {
                                            const isSelected = selectedMatch === parseInt(match.id);
                                            return (
                                                <div
                                                    key={match.id}
                                                    className={`custom-seed ${isSelected ? 'selected' : ''}`}
                                                    onClick={() =>
                                                        canEditMatches &&
                                                        match.state !== 'DONE' &&
                                                        setSelectedMatch(isSelected ? null : parseInt(match.id))
                                                    }
                                                >
                                                    <div className="match-number">{match.name}</div>
                                                    <div className="match-teams">
                                                        <div
                                                            className={`team ${match.participants[0].isWinner ? 'winner' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTeamClick(match.participants[0].id, match.id);
                                                            }}
                                                        >
                                                            <span className="team-name">{match.participants[0].name.slice(0, 20)}</span>
                                                            <span className="team-score">
                                                                {match.participants[0].score > 0 ? match.participants[0].score : '-'}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={`team ${match.participants[1].isWinner ? 'winner' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTeamClick(match.participants[1].id, match.id);
                                                            }}
                                                        >
                                                            <span className="team-name">{match.participants[1].name.slice(0, 20)}</span>
                                                            <span className="team-score">
                                                                {match.participants[1].score > 0 ? match.participants[1].score : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Матч за 3-е место и гранд-финал */}
            <div className="final-matches">
                {placementMatch && (
                    <div className="placement-match">
                        <h2>Match for 3rd Place</h2>
                        <div className="custom-seed">
                            <div className="match-number">{placementMatch.name}</div>
                            <div className="match-teams">
                                <div
                                    className={`team ${placementMatch.participants[0].isWinner ? 'winner' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTeamClick(placementMatch.participants[0].id, placementMatch.id);
                                    }}
                                >
                                    <span className="team-name">{placementMatch.participants[0].name.slice(0, 20)}</span>
                                    <span className="team-score">
                                        {placementMatch.participants[0].score > 0 ? placementMatch.participants[0].score : '-'}
                                    </span>
                                </div>
                                <div
                                    className={`team ${placementMatch.participants[1].isWinner ? 'winner' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTeamClick(placementMatch.participants[1].id, placementMatch.id);
                                    }}
                                >
                                    <span className="team-name">{placementMatch.participants[1].name.slice(0, 20)}</span>
                                    <span className="team-score">
                                        {placementMatch.participants[1].score > 0 ? placementMatch.participants[1].score : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {grandFinalMatch && (
                    <div className="grand-final">
                        <h2>Grand Final</h2>
                        <div className="custom-seed">
                            <div className="match-number">{grandFinalMatch.name}</div>
                            <div className="match-teams">
                                <div
                                    className={`team ${grandFinalMatch.participants[0].isWinner ? 'winner' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTeamClick(grandFinalMatch.participants[0].id, grandFinalMatch.id);
                                    }}
                                >
                                    <span className="team-name">{grandFinalMatch.participants[0].name.slice(0, 20)}</span>
                                    <span className="team-score">
                                        {grandFinalMatch.participants[0].score > 0 ? grandFinalMatch.participants[0].score : '-'}
                                    </span>
                                </div>
                                <div
                                    className={`team ${grandFinalMatch.participants[1].isWinner ? 'winner' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTeamClick(grandFinalMatch.participants[1].id, grandFinalMatch.id);
                                    }}
                                >
                                    <span className="team-name">{grandFinalMatch.participants[1].name.slice(0, 20)}</span>
                                    <span className="team-score">
                                        {grandFinalMatch.participants[1].score > 0 ? grandFinalMatch.participants[1].score : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BracketRenderer;