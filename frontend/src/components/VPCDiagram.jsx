import React, { useState } from 'react';

const COLORS = {
  vpc1:     '#1d4ed8',
  vpc2:     '#7c3aed',
  pubSub:   '#059669',
  privSub:  '#d97706',
  peering:  '#FF9900',
  ec2:      '#0ea5e9',
  igw:      '#10b981',
  rt:       '#8b5cf6',
};

/** Small tooltip bubble */
function Tooltip({ x, y, text }) {
  const lines = text.split('\n');
  const w = Math.max(...lines.map(l => l.length)) * 7 + 24;
  const h = lines.length * 18 + 16;
  return (
    <g>
      <rect
        x={x - w / 2} y={y - h - 8}
        width={w} height={h}
        rx={8}
        fill="rgba(13,27,42,0.95)"
        stroke="rgba(255,153,0,0.4)"
        strokeWidth={1}
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x} y={y - h - 8 + 14 + i * 18}
          textAnchor="middle"
          fill="#fff"
          fontSize={11}
          fontFamily="monospace"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** Animated dashed line (data flow) */
function AnimatedLine({ x1, y1, x2, y2, color = '#FF9900', id }) {
  return (
    <>
      <defs>
        <marker id={`arrow-${id}`} markerWidth={10} markerHeight={7} refX={10} refY={3.5} orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="8 4"
        markerEnd={`url(#arrow-${id})`}
        opacity={0.8}
      >
        <animate attributeName="stroke-dashoffset" from={0} to={-24} dur="1.2s" repeatCount="indefinite" />
      </line>
    </>
  );
}

/** EC2 icon box */
function EC2Node({ x, y, label, ip, onHover, active }) {
  return (
    <g
      onMouseEnter={() => onHover({ label, ip })}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={x - 36} y={y - 20}
        width={72} height={40}
        rx={8}
        fill={active ? 'rgba(14,165,233,0.3)' : 'rgba(14,165,233,0.15)'}
        stroke={COLORS.ec2}
        strokeWidth={active ? 2 : 1}
      />
      <text x={x} y={y - 4} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600}>{label}</text>
      <text x={x} y={y + 10} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize={9} fontFamily="monospace">{ip}</text>
    </g>
  );
}

/** Subnet box */
function SubnetBox({ x, y, w, h, label, cidr, color, children }) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h}
        rx={10}
        fill={`${color}18`}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 3"
      />
      <text x={x + 12} y={y + 18} fill={color} fontSize={11} fontWeight={700}>{label}</text>
      <text x={x + 12} y={y + 32} fill="rgba(255,255,255,0.45)" fontSize={9} fontFamily="monospace">{cidr}</text>
      {children}
    </g>
  );
}

/** VPC boundary box */
function VPCBox({ x, y, w, h, label, cidr, color, children }) {
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h}
        rx={14}
        fill={`${color}10`}
        stroke={color}
        strokeWidth={2}
      />
      <rect x={x + 8} y={y - 12} width={cidr.length * 7.5 + label.length * 8 + 24} height={24} rx={6} fill={color} />
      <text x={x + 16} y={y + 5} fill="#fff" fontSize={12} fontWeight={700}>{label}</text>
      <text x={x + 16 + label.length * 8 + 8} y={y + 5} fill="rgba(255,255,255,0.8)" fontSize={10} fontFamily="monospace">{cidr}</text>
      {children}
    </g>
  );
}

export default function VPCDiagram({ compact = false }) {
  const [tooltip, setTooltip] = useState(null);
  const [hovered, setHovered] = useState(null);

  const W = compact ? 680 : 860;
  const H = compact ? 380 : 480;

  const handleHover = (info) => {
    setHovered(info ? info.label : null);
    setTooltip(info ? { label: info.label, ip: info.ip } : null);
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxWidth: W, display: 'block', margin: '0 auto', filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.4))' }}
        role="img"
        aria-label="AWS VPC Peering Architecture Diagram"
      >
        {/* Background */}
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0a0e1a" />
            <stop offset="100%" stopColor="#0d1b2a" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width={W} height={H} rx={20} fill="url(#bgGrad)" />

        {/* AWS Cloud border */}
        <rect x={10} y={10} width={W - 20} height={H - 20} rx={16}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} strokeDasharray="10 5" />
        <text x={24} y={34} fill="rgba(255,255,255,0.3)" fontSize={11} fontWeight={600}>☁ AWS Cloud — ap-south-1</text>

        {/* Internet box (top) */}
        <rect x={W / 2 - 60} y={44} width={120} height={32} rx={8}
          fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <text x={W / 2} y={65} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={11}>🌐 Internet</text>

        {/* IGW */}
        <rect x={W / 2 - 44} y={100} width={88} height={28} rx={6}
          fill="rgba(16,185,129,0.2)" stroke={COLORS.igw} strokeWidth={1.5} />
        <text x={W / 2} y={119} textAnchor="middle" fill={COLORS.igw} fontSize={10} fontWeight={700}>Internet Gateway</text>

        {/* Internet → IGW line */}
        <line x1={W / 2} y1={76} x2={W / 2} y2={100} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />

        {/* VPC 1 */}
        <VPCBox x={30} y={50} w={compact ? 290 : 360} h={H - 80} label="VPC-1" cidr="10.28.0.0/16" color={COLORS.vpc1}>
          {/* IGW → Public Subnet line */}
          <line x1={compact ? 175 : 210} y1={128} x2={compact ? 175 : 210} y2={155}
            stroke={COLORS.igw} strokeWidth={1.5} strokeDasharray="4 3" />

          {/* Public Subnet */}
          <SubnetBox
            x={50} y={compact ? 150 : 160}
            w={compact ? 240 : 310} h={compact ? 90 : 100}
            label="Public Subnet" cidr="10.28.1.0/24"
            color={COLORS.pubSub}
          >
            <EC2Node
              x={compact ? 135 : 155} y={compact ? 215 : 225}
              label="EC2-Public" ip="10.28.1.10"
              onHover={handleHover}
              active={hovered === 'EC2-Public'}
            />
            {/* Route Table tag */}
            <rect x={compact ? 195 : 265} y={compact ? 165 : 175} width={74} height={20} rx={4}
              fill="rgba(139,92,246,0.2)" stroke={COLORS.rt} strokeWidth={1} />
            <text x={compact ? 232 : 302} y={compact ? 178 : 188} textAnchor="middle"
              fill={COLORS.rt} fontSize={9} fontWeight={600}>RT-Public</text>
          </SubnetBox>

          {/* Private Subnet */}
          <SubnetBox
            x={50} y={compact ? 260 : 280}
            w={compact ? 240 : 310} h={compact ? 90 : 100}
            label="Private Subnet" cidr="10.28.2.0/24"
            color={COLORS.privSub}
          >
            <EC2Node
              x={compact ? 135 : 155} y={compact ? 325 : 345}
              label="EC2-Private" ip="10.28.2.10"
              onHover={handleHover}
              active={hovered === 'EC2-Private'}
            />
            <rect x={compact ? 195 : 265} y={compact ? 275 : 295} width={74} height={20} rx={4}
              fill="rgba(139,92,246,0.2)" stroke={COLORS.rt} strokeWidth={1} />
            <text x={compact ? 232 : 302} y={compact ? 288 : 308} textAnchor="middle"
              fill={COLORS.rt} fontSize={9} fontWeight={600}>RT-Private</text>
          </SubnetBox>

          {/* EC2-Public ↔ EC2-Private */}
          <line
            x1={compact ? 135 : 155} y1={compact ? 236 : 246}
            x2={compact ? 135 : 155} y2={compact ? 315 : 335}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="4 3"
          />
        </VPCBox>

        {/* VPC Peering connection (middle) */}
        {/* Line from VPC1 to VPC2 */}
        <AnimatedLine
          x1={compact ? 322 : 392} y1={H / 2}
          x2={compact ? 398 : 468} y2={H / 2}
          color={COLORS.peering} id="peer12"
        />
        <AnimatedLine
          x1={compact ? 398 : 468} y1={H / 2 + 4}
          x2={compact ? 322 : 392} y2={H / 2 + 4}
          color={COLORS.peering} id="peer21"
        />

        {/* Peering label */}
        <rect x={compact ? 320 : 390} y={H / 2 - 20} width={80} height={20} rx={6}
          fill="rgba(255,153,0,0.15)" stroke={COLORS.peering} strokeWidth={1} />
        <text x={compact ? 360 : 430} y={H / 2 - 6} textAnchor="middle"
          fill={COLORS.peering} fontSize={9} fontWeight={700}>VPC Peering</text>

        {/* VPC 2 */}
        <VPCBox
          x={compact ? 400 : 470} y={50}
          w={compact ? 250 : 360} h={H - 80}
          label="VPC-2" cidr="10.28.200.0/16"
          color={COLORS.vpc2}
        >
          {/* Private Subnet 2 */}
          <SubnetBox
            x={compact ? 420 : 490} y={compact ? 180 : 190}
            w={compact ? 200 : 320} h={compact ? 120 : 130}
            label="Private Subnet" cidr="10.28.200.0/24"
            color={COLORS.privSub}
          >
            <EC2Node
              x={compact ? 520 : 650} y={compact ? 255 : 270}
              label="EC2-VPC2" ip="10.28.200.10"
              onHover={handleHover}
              active={hovered === 'EC2-VPC2'}
            />
            <rect x={compact ? 420 : 492} y={compact ? 200 : 210} width={74} height={20} rx={4}
              fill="rgba(139,92,246,0.2)" stroke={COLORS.rt} strokeWidth={1} />
            <text x={compact ? 457 : 529} y={compact ? 213 : 223} textAnchor="middle"
              fill={COLORS.rt} fontSize={9} fontWeight={600}>RT-Private</text>
          </SubnetBox>
        </VPCBox>

        {/* IGW connect line to VPC1 public subnet */}
        <line
          x1={W / 2 - 44} y1={114}
          x2={compact ? 175 : 210} y2={114}
          stroke={COLORS.igw} strokeWidth={1.5} strokeDasharray="4 3"
        />
        <line
          x1={compact ? 175 : 210} y1={114}
          x2={compact ? 175 : 210} y2={compact ? 150 : 160}
          stroke={COLORS.igw} strokeWidth={1.5} strokeDasharray="4 3"
        />

        {/* Legend */}
        {[
          { color: COLORS.vpc1, label: 'VPC' },
          { color: COLORS.pubSub,  label: 'Public Subnet' },
          { color: COLORS.privSub, label: 'Private Subnet' },
          { color: COLORS.ec2,     label: 'EC2 Instance' },
          { color: COLORS.igw,     label: 'Internet GW' },
          { color: COLORS.peering, label: 'VPC Peering' },
        ].map(({ color, label }, i) => (
          <g key={label} transform={`translate(${30 + i * (compact ? 110 : 135)}, ${H - 22})`}>
            <rect x={0} y={-8} width={10} height={10} rx={2} fill={color} />
            <text x={14} y={0} fill="rgba(255,255,255,0.5)" fontSize={9}>{label}</text>
          </g>
        ))}

        {/* Tooltip */}
        {tooltip && (
          <Tooltip
            x={W / 2}
            y={H / 2 - 20}
            text={`${tooltip.label}\n${tooltip.ip}`}
          />
        )}
      </svg>
    </div>
  );
}
