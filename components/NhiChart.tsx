"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface NhiSet { gmail: number; yahoo: number; other: number; total: number; }
interface Props { campaign?: NhiSet | null; benchmark: NhiSet; }

const COLORS = {
	gmail: '#4285F4',
	yahoo: '#720E9E',
	other: '#6B7280'
};

const NhiChart: React.FC<Props> = ({ campaign, benchmark }) => {
	const data = [
		{
			name: 'Benchmark',
			gmail: benchmark.gmail,
			yahoo: benchmark.yahoo,
			other: benchmark.other,
		},
		...(campaign ? [{ name: 'Your Campaign', gmail: campaign.gmail, yahoo: campaign.yahoo, other: campaign.other }] : [])
	];

	return (
		<div style={{ border:'1px solid var(--color-mist)', background:'var(--color-shell)', padding:'0.75rem 0.9rem', borderRadius:4 }}>
			<h3 style={{ margin:'0 0 0.4rem', fontSize:13, fontWeight:600 }}>NHI Breakdown</h3>
			<div style={{ width:'100%', height:260 }}>
				<ResponsiveContainer>
					<BarChart data={data} barGap={12}>
						<XAxis dataKey="name" stroke="var(--color-onyx)" tick={{ fontSize: 11 }} />
						<YAxis stroke="var(--color-onyx)" tick={{ fontSize: 11 }} unit="%" />
						<Tooltip formatter={(v:number)=> v.toFixed(2) + '%'} />
						<Legend wrapperStyle={{ fontSize: 11 }} />
						<Bar dataKey="gmail" stackId="a" fill={COLORS.gmail} />
						<Bar dataKey="yahoo" stackId="a" fill={COLORS.yahoo} />
						<Bar dataKey="other" stackId="a" fill={COLORS.other} />
					</BarChart>
				</ResponsiveContainer>
			</div>
			<p style={{ margin:'0.5rem 0 0', fontSize:11, opacity:0.75 }}>Totals are the combined non-human interaction indicators for the most common mailbox providers.</p>
		</div>
	);
};

export default NhiChart;

