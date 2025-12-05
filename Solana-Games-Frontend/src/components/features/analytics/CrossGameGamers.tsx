import React, { useMemo } from 'react';
import { useAutoRefresh } from '../../../hooks/useAutoRefresh';
import type { CrossGameGamer } from '../../../types/api';
import { GlassCard } from '../../ui/GlassCard';
import { CompleteDataTable } from '../../ui/CompleteDataTable';
import { KPICard } from '../../ui/KPICard';
import { safeNumber, formatNumber } from '../../../utils/formatters';
import { Share2, Link, ExternalLink, Info } from 'lucide-react';

export const CrossGameGamersFeature: React.FC = () => {
    const { data, loading, error } = useAutoRefresh<CrossGameGamer>('/api/analytics/cross-game-gamers');

    React.useEffect(() => {
        if (data?.data && data.data.length > 0) {
            console.log('🔍 CrossGameGamers Data Sample:', data.data[0]);
            console.log('🔍 Keys:', Object.keys(data.data[0]));
        }
    }, [data]);

    const kpis = useMemo(() => {
        if (!data?.data || data.data.length === 0) return { total: 0, avgGames: '0.0', topCombo: '-' };

        console.log('🔍 CrossGameGamers DEBUG - Data sample:', data.data[0]);

        const total = data.data.length;
        const avgGames = total > 0
            ? data.data.reduce((sum, curr) => sum + safeNumber(curr.games_played || curr['games played']), 0) / total
            : 0;

        // Find most popular game combo
        const combos = data.data.reduce((acc, curr) => {
            const gamesStr = curr.games || curr['games list'] || '';
            if (!gamesStr) return acc;

            const combo = gamesStr.split(',').sort().join(' + ');
            acc[combo] = (acc[combo] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topCombo = Object.entries(combos).sort((a, b) => b[1] - a[1])[0];

        return {
            total,
            avgGames: safeNumber(avgGames).toFixed(2),
            topCombo: topCombo ? topCombo[0] : '-'
        };
    }, [data]);

    const networkData = useMemo(() => {
        if (!data?.data) return { nodes: [], links: [] };

        const games = new Set<string>();
        const links: Record<string, number> = {};

        data.data.forEach(user => {
            const gamesStr = user.games || user['games list'] || '';
            if (!gamesStr) return;

            const userGames = gamesStr.split(',').map(g => g.trim()).filter(Boolean);
            userGames.forEach(g => games.add(g));

            // Create links between all pairs
            for (let i = 0; i < userGames.length; i++) {
                for (let j = i + 1; j < userGames.length; j++) {
                    const source = userGames[i] < userGames[j] ? userGames[i] : userGames[j];
                    const target = userGames[i] < userGames[j] ? userGames[j] : userGames[i];
                    const key = `${source}|${target}`;
                    links[key] = (links[key] || 0) + 1;
                }
            }
        });

        const nodes = Array.from(games).map((id, i, arr) => {
            const angle = (i / arr.length) * 2 * Math.PI;
            return {
                id,
                x: Math.cos(angle) * 150 + 200,
                y: Math.sin(angle) * 150 + 200
            };
        });

        const linkArray = Object.entries(links).map(([key, value]) => {
            const [source, target] = key.split('|');
            return { source, target, value };
        });

        return { nodes, links: linkArray };
    }, [data]);

    const columns = useMemo(() => [
        {
            key: 'gamer',
            label: 'Gamer Wallet',
            render: (value: any) => (
                <a
                    href={`https://solscan.io/account/${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-solana-purple hover:text-solana-cyan transition-colors flex items-center gap-2"
                >
                    {value.slice(0, 6)}...{value.slice(-6)}
                    <ExternalLink className="w-3 h-3" />
                </a>
            ),
        },
        {
            key: 'games',
            label: 'Games Played',
            render: (value: any) => (
                <div className="flex flex-wrap gap-1">
                    {value.split(',').map((game: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-bg-tertiary text-xs border border-border">
                            {game.trim()}
                        </span>
                    ))}
                </div>
            ),
        },
        {
            key: 'games_played',
            label: 'Count',
            render: (value: any, row: any) => <span className="font-bold">{safeNumber(value || row['games played'])}</span>,
        },
    ], []);

    const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);
    const [hoveredLink, setHoveredLink] = React.useState<{ source: string; target: string; value: number } | null>(null);

    // ... (keep existing useMemo hooks)

    return (
        <div className="space-y-6">
            <div className="bg-bg-tertiary/50 border border-solana-purple/20 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-solana-purple flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-secondary leading-relaxed">
                    <p>
                        This identifies Solana gamers who actively play <strong className="text-text-primary">3 or more games</strong>, showcasing cross-platform engagement across the Solana gaming ecosystem.
                        These "power users" represent highly engaged players who diversify their gaming activities across multiple projects.
                        The results include each gamer's wallet address, the total number of games they play, a list of specific games they're active in, and a direct link to view their full on-chain portfolio.
                        This data helps identify the most engaged segment of the Solana gaming community and reveals popular game combinations among multi-game players.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Cross-Gamers"
                    value={formatNumber(kpis.total)}
                    icon={<Share2 className="w-4 h-4" />}
                    color="purple"
                />
                <KPICard
                    title="Avg Games / Cross-Gamer"
                    value={kpis.avgGames}
                    icon={<Link className="w-4 h-4" />}
                    color="cyan"
                />
                <KPICard
                    title="Top Game Combo"
                    value={kpis.topCombo}
                    icon={<Share2 className="w-4 h-4" />}
                    color="green"
                />
            </div>

            <GlassCard className="h-[600px] flex flex-col relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-gaming font-bold">Game Interconnection Network</h3>
                    <div className="text-xs text-text-secondary">
                        Hover over nodes or lines for details
                    </div>
                </div>

                {networkData.nodes.length > 0 ? (
                    <>
                        <div className="flex-grow flex items-center justify-center overflow-hidden relative">
                            <svg width="500" height="500" viewBox="0 0 400 400" className="w-full h-full max-w-[600px] max-h-[600px]">
                                <defs>
                                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                                        <path d="M0,0 L0,6 L9,3 z" fill="#5A5A5F" />
                                    </marker>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="2" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {/* Links */}
                                {networkData.links.map((link, i) => {
                                    const sourceNode = networkData.nodes.find(n => n.id === link.source);
                                    const targetNode = networkData.nodes.find(n => n.id === link.target);
                                    if (!sourceNode || !targetNode) return null;

                                    const maxVal = Math.max(...networkData.links.map(l => l.value), 1);

                                    // Interaction Logic
                                    const isConnectedToHoveredNode = hoveredNode && (link.source === hoveredNode || link.target === hoveredNode);
                                    const isHoveredLink = hoveredLink === link;
                                    const isDimmed = (hoveredNode && !isConnectedToHoveredNode) || (hoveredLink && !isHoveredLink);

                                    const opacity = isHoveredLink || isConnectedToHoveredNode ? 1 : (isDimmed ? 0.1 : Math.max(0.2, link.value / maxVal));
                                    const width = isHoveredLink || isConnectedToHoveredNode ? 3 : Math.max(1, (link.value / maxVal) * 5);
                                    const color = isHoveredLink || isConnectedToHoveredNode ? '#14F195' : '#9945FF';

                                    return (
                                        <line
                                            key={i}
                                            x1={sourceNode.x}
                                            y1={sourceNode.y}
                                            x2={targetNode.x}
                                            y2={targetNode.y}
                                            stroke={color}
                                            strokeOpacity={opacity}
                                            strokeWidth={width}
                                            className="transition-all duration-300 cursor-pointer"
                                            onMouseEnter={() => setHoveredLink(link)}
                                            onMouseLeave={() => setHoveredLink(null)}
                                        />
                                    );
                                })}

                                {/* Nodes */}
                                {networkData.nodes.map((node, i) => {
                                    const isHovered = hoveredNode === node.id;
                                    const isConnected = hoveredLink && (hoveredLink.source === node.id || hoveredLink.target === node.id);
                                    const isDimmed = (hoveredNode && !isHovered) && (hoveredLink && !isConnected);

                                    return (
                                        <g
                                            key={i}
                                            transform={`translate(${node.x},${node.y})`}
                                            className="cursor-pointer transition-all duration-300"
                                            style={{ opacity: isDimmed ? 0.3 : 1 }}
                                            onMouseEnter={() => setHoveredNode(node.id)}
                                            onMouseLeave={() => setHoveredNode(null)}
                                        >
                                            <circle
                                                r={isHovered ? 25 : 20}
                                                fill="#1A1A1D"
                                                stroke={isHovered || isConnected ? "#14F195" : "#9945FF"}
                                                strokeWidth={isHovered ? 3 : 2}
                                                filter={isHovered ? "url(#glow)" : ""}
                                                className="transition-all duration-300"
                                            />
                                            <text
                                                dy={isHovered ? 40 : 35}
                                                textAnchor="middle"
                                                fill={isHovered ? "#14F195" : "#fff"}
                                                fontSize={isHovered ? "12" : "10"}
                                                fontWeight={isHovered ? "bold" : "normal"}
                                                className="select-none pointer-events-none transition-all duration-300"
                                            >
                                                {node.id}
                                            </text>
                                            <GameIcon scale={isHovered ? 0.9 : 0.7} />
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Tooltip Overlay */}
                            {(hoveredLink || hoveredNode) && (
                                <div className="absolute top-4 right-4 bg-bg-tertiary/95 border border-solana-purple/30 p-3 rounded-lg shadow-xl backdrop-blur-sm z-10 max-w-[200px] animate-in fade-in zoom-in duration-200">
                                    {hoveredLink ? (
                                        <div className="text-center">
                                            <div className="text-xs text-text-secondary mb-1">Shared Players</div>
                                            <div className="font-bold text-solana-cyan text-sm mb-1">
                                                {hoveredLink.source} <span className="text-text-secondary">+</span> {hoveredLink.target}
                                            </div>
                                            <div className="text-xl font-mono text-white">{hoveredLink.value}</div>
                                        </div>
                                    ) : hoveredNode ? (
                                        <div className="text-center">
                                            <div className="text-xs text-text-secondary mb-1">Game</div>
                                            <div className="font-bold text-solana-purple text-lg">{hoveredNode}</div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                        <div className="text-center text-xs text-text-secondary mt-2">
                            Thickness represents number of shared players • Hover for details • <span className="text-solana-purple">Gamers playing 3+ games only</span>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-text-secondary">
                        <div className="text-center">
                            <span className="text-4xl">🎮</span>
                            <p className="mt-2">No cross-game data available</p>
                        </div>
                    </div>
                )}
            </GlassCard>

            <CompleteDataTable
                data={data?.data || []}
                columns={columns}
                title="Cross-Game Players"
                searchable={true}
                pageSize={10}
            />
        </div>
    );
};

const GameIcon = ({ scale = 0.7 }: { scale?: number }) => (
    <g transform={`translate(-8, -8) scale(${scale})`}>
        <path
            d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10zm0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8zm-2 5h4v2h2v4h-2v2h-4v-2h-2v-4h2v-2z"
            fill="#14F195"
        />
    </g>
);
