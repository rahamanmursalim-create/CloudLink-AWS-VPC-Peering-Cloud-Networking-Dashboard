import React, { useState } from 'react';
import GlassCard from '../components/GlassCard.jsx';

const STEPS = [
  {
    id: 1, phase: 'Setup', title: 'Sign in to AWS Console',
    icon: '🔑',
    desc: 'Navigate to https://console.aws.amazon.com and sign in. Select region ap-south-1 (Mumbai) from the top-right region selector.',
    commands: [],
    tip: 'Use ap-south-1 for lowest latency from India. Ensure your IAM user has VPC, EC2, and networking permissions.',
  },
  {
    id: 2, phase: 'VPC 1', title: 'Create VPC-1',
    icon: '🌐',
    desc: 'Go to VPC Dashboard → Your VPCs → Create VPC. Select "VPC only", set name tag to VPC-1, IPv4 CIDR to 10.28.0.0/16, tenancy to Default.',
    commands: ['Name: VPC-1', 'IPv4 CIDR: 10.28.0.0/16', 'Tenancy: Default'],
    tip: '/16 gives you 65,536 IP addresses to distribute across subnets.',
  },
  {
    id: 3, phase: 'VPC 1', title: 'Create Public Subnet in VPC-1',
    icon: '📦',
    desc: 'Go to Subnets → Create subnet. Select VPC-1. Set subnet name to Public-Subnet-1, Availability Zone to ap-south-1a, IPv4 CIDR to 10.28.1.0/24.',
    commands: ['Name: Public-Subnet-1', 'VPC: VPC-1', 'AZ: ap-south-1a', 'CIDR: 10.28.1.0/24'],
    tip: '10.28.1.0/24 provides 256 IPs (251 usable after AWS reserves 5).',
  },
  {
    id: 4, phase: 'VPC 1', title: 'Create Private Subnet in VPC-1',
    icon: '📦',
    desc: 'Create another subnet in VPC-1. Name it Private-Subnet-1, use AZ ap-south-1a (or ap-south-1b), CIDR 10.28.2.0/24.',
    commands: ['Name: Private-Subnet-1', 'VPC: VPC-1', 'AZ: ap-south-1a', 'CIDR: 10.28.2.0/24'],
    tip: 'Keep public and private subnets in different AZs for high availability in production.',
  },
  {
    id: 5, phase: 'VPC 1', title: 'Create Internet Gateway',
    icon: '🚪',
    desc: 'Go to Internet Gateways → Create internet gateway. Name it IGW-1. After creation, click Actions → Attach to VPC → select VPC-1.',
    commands: ['Name: IGW-1', 'Action: Attach to VPC → VPC-1'],
    tip: 'One IGW per VPC. Without it, instances in public subnets cannot reach the internet.',
  },
  {
    id: 6, phase: 'VPC 1', title: 'Create Public Route Table',
    icon: '🛣️',
    desc: 'Go to Route Tables → Create route table. Name it RT-Public-1, associate it with VPC-1. After creation, go to Routes → Edit routes → Add route: Destination 0.0.0.0/0, Target: IGW-1.',
    commands: ['Name: RT-Public-1', 'VPC: VPC-1', 'Route: 0.0.0.0/0 → IGW-1'],
    tip: 'The 0.0.0.0/0 → IGW route makes this a "public" route table, enabling internet access for associated subnets.',
  },
  {
    id: 7, phase: 'VPC 1', title: 'Associate Public Subnet with Public Route Table',
    icon: '🔗',
    desc: 'In RT-Public-1, go to Subnet Associations tab → Edit subnet associations → select Public-Subnet-1 → Save.',
    commands: ['RT-Public-1 → Subnet Associations → Public-Subnet-1'],
    tip: 'Only explicitly associated subnets use this route table. Unassociated subnets use the main route table.',
  },
  {
    id: 8, phase: 'VPC 1', title: 'Create Private Route Table',
    icon: '🛣️',
    desc: 'Create another route table named RT-Private-1 for VPC-1. Associate it with Private-Subnet-1. Leave routes as local-only for now (peering route added later).',
    commands: ['Name: RT-Private-1', 'VPC: VPC-1', 'Associate: Private-Subnet-1'],
    tip: 'Keep private route tables internet-free — only add peering routes to them, never IGW routes.',
  },
  {
    id: 9, phase: 'VPC 1', title: 'Launch EC2 in Public Subnet',
    icon: '💻',
    desc: 'EC2 → Launch Instance. Name: EC2-Public-1. AMI: Amazon Linux 2023. Type: t2.micro (free tier). Network: VPC-1, Subnet: Public-Subnet-1. Enable Auto-assign Public IP. Create or select a key pair. Configure Security Group: Allow SSH (22) from anywhere and ICMP from anywhere.',
    commands: [
      'Name: EC2-Public-1',
      'AMI: Amazon Linux 2023',
      'Instance type: t2.micro',
      'VPC: VPC-1 | Subnet: Public-Subnet-1',
      'Auto-assign Public IP: Enable',
      'SG Inbound: SSH 22 (0.0.0.0/0), ICMP all',
    ],
    tip: 'Save the key pair (.pem file) securely — you need it to SSH. Set file permissions: chmod 400 key.pem',
  },
  {
    id: 10, phase: 'VPC 1', title: 'Launch EC2 in Private Subnet',
    icon: '💻',
    desc: 'Launch another EC2. Name: EC2-Private-1. Same AMI and type. Network: VPC-1, Subnet: Private-Subnet-1. Do NOT enable public IP. SG: Allow SSH from 10.28.1.0/24, ICMP from 10.28.0.0/16.',
    commands: [
      'Name: EC2-Private-1',
      'VPC: VPC-1 | Subnet: Private-Subnet-1',
      'Auto-assign Public IP: Disable',
      'SG Inbound: SSH 22 from 10.28.1.0/24, ICMP from 10.28.0.0/16',
    ],
    tip: 'You will access this EC2 by first SSH-ing into EC2-Public-1, then SSH-ing from there to EC2-Private-1 (jump/bastion pattern).',
  },
  {
    id: 11, phase: 'VPC 2', title: 'Create VPC-2',
    icon: '🌐',
    desc: 'Create a second VPC. Name: VPC-2, CIDR: 10.28.200.0/16. IMPORTANT: CIDR blocks of the two VPCs must NOT overlap — otherwise peering will fail.',
    commands: ['Name: VPC-2', 'IPv4 CIDR: 10.28.200.0/16', 'Tenancy: Default'],
    tip: '⚠️ VPC CIDRs cannot overlap for peering to work. 10.28.0.0/16 and 10.28.200.0/16 are compatible.',
  },
  {
    id: 12, phase: 'VPC 2', title: 'Create Private Subnet in VPC-2',
    icon: '📦',
    desc: 'Create a subnet in VPC-2. Name: Private-Subnet-2, AZ: ap-south-1a, CIDR: 10.28.200.0/24. No IGW needed in VPC-2.',
    commands: ['Name: Private-Subnet-2', 'VPC: VPC-2', 'AZ: ap-south-1a', 'CIDR: 10.28.200.0/24'],
    tip: 'VPC-2 is fully private — no internet access by design. Connectivity only via peering.',
  },
  {
    id: 13, phase: 'VPC 2', title: 'Create Route Table for VPC-2',
    icon: '🛣️',
    desc: 'Create route table RT-Private-2 for VPC-2. Associate it with Private-Subnet-2. Leave routes local for now.',
    commands: ['Name: RT-Private-2', 'VPC: VPC-2', 'Associate: Private-Subnet-2'],
    tip: 'The peering route will be added to this RT after creating the peering connection.',
  },
  {
    id: 14, phase: 'VPC 2', title: 'Launch EC2 in VPC-2',
    icon: '💻',
    desc: 'Launch EC2. Name: EC2-Private-2 (or EC2-VPC2). Network: VPC-2, Subnet: Private-Subnet-2. No public IP. SG: Allow SSH from 10.28.0.0/16, ICMP from 10.28.0.0/16.',
    commands: [
      'Name: EC2-VPC2',
      'VPC: VPC-2 | Subnet: Private-Subnet-2',
      'Auto-assign Public IP: Disable',
      'SG Inbound: SSH 22 from 10.28.0.0/16, ICMP from 10.28.0.0/16',
    ],
    tip: 'Security group source 10.28.0.0/16 covers the entire VPC-1 range so you can reach this EC2 from any VPC-1 instance after peering.',
  },
  {
    id: 15, phase: 'Peering', title: 'Create VPC Peering Connection',
    icon: '🔗',
    desc: 'Go to VPC → Peering Connections → Create peering connection. Name: VPC-1-2-Peering. Requester: VPC-1. Accepter: This account, same region, VPC-2. Click Create.',
    commands: [
      'Name: VPC-1-2-Peering',
      'Requester VPC: VPC-1 (10.28.0.0/16)',
      'Account: My account',
      'Region: ap-south-1',
      'Accepter VPC: VPC-2 (10.28.200.0/16)',
    ],
    tip: 'Peering is NOT transitive — you cannot route through VPC-2 to reach a third VPC. Each pair needs its own peering connection.',
  },
  {
    id: 16, phase: 'Peering', title: 'Accept Peering Connection',
    icon: '✅',
    desc: 'After creating the peering connection, its status is "Pending Acceptance". Select it → Actions → Accept Request → Confirm.',
    commands: ['Select peering connection → Actions → Accept Request'],
    tip: 'In cross-account peering, the accepter account owner must accept via the console or CLI. Here both VPCs are in the same account.',
  },
  {
    id: 17, phase: 'Peering', title: 'Add Peering Route to VPC-1 Route Tables',
    icon: '🛣️',
    desc: 'Go to RT-Public-1: Edit routes → Add: Destination 10.28.200.0/16, Target: Peering Connection (pcx-…). Repeat for RT-Private-1.',
    commands: [
      'RT-Public-1 → Edit routes → Add:',
      '  Destination: 10.28.200.0/16',
      '  Target: pcx-xxxxxxxx (Peering Connection)',
      'Repeat for RT-Private-1',
    ],
    tip: 'Both VPC-1 route tables need the peering route so that both public and private EC2s can reach VPC-2.',
  },
  {
    id: 18, phase: 'Peering', title: 'Add Peering Route to VPC-2 Route Table',
    icon: '🛣️',
    desc: 'Go to RT-Private-2 in VPC-2: Edit routes → Add: Destination 10.28.0.0/16, Target: same Peering Connection.',
    commands: [
      'RT-Private-2 → Edit routes → Add:',
      '  Destination: 10.28.0.0/16',
      '  Target: pcx-xxxxxxxx (Peering Connection)',
    ],
    tip: 'Routing is bidirectional but explicit — both VPCs need the return route or only one-way traffic works.',
  },
  {
    id: 19, phase: 'Verify', title: 'SSH into EC2-Public-1 and Test',
    icon: '🖥️',
    desc: 'From your local machine, SSH into the public EC2. Then ping both private EC2s. Copy your key to EC2-Public-1 to jump further.',
    commands: [
      '# From local machine:',
      'ssh -i key.pem ec2-user@<PUBLIC-IP-OF-EC2-Public-1>',
      '',
      '# From inside EC2-Public-1:',
      'ping 10.28.2.10    # Ping EC2-Private-1',
      'ping 10.28.200.10  # Ping EC2-VPC2 via peering',
    ],
    tip: 'Use scp or ssh-agent forwarding to pass your key to EC2-Public-1 so you can SSH further into private instances.',
  },
  {
    id: 20, phase: 'Verify', title: 'Verify Cross-VPC Connectivity',
    icon: '🎉',
    desc: 'From EC2-Public-1, ping EC2-VPC2 (10.28.200.10). If you get replies — peering is working! Also SSH into EC2-Private-1 and verify it can ping EC2-VPC2.',
    commands: [
      '# From EC2-Public-1:',
      'ping -c 4 10.28.200.10',
      '# Expected: 4 packets received, 0% packet loss',
      '',
      '# From EC2-Private-1 (SSH via EC2-Public-1):',
      'ssh -i key.pem ec2-user@10.28.2.10',
      'ping -c 4 10.28.200.10',
    ],
    tip: '🎉 Success! Take screenshots of the ping output — this is your project deliverable. Log results in the Connectivity page of this dashboard.',
  },
];

const PHASES = ['All', ...new Set(STEPS.map(s => s.phase))];

export default function Guide() {
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('vpc_completed_steps');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [expandedStep, setExpandedStep] = useState(null);
  const [filterPhase, setFilterPhase] = useState('All');

  const toggleComplete = (id) => {
    setCompletedSteps(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('vpc_completed_steps', JSON.stringify(next));
      return next;
    });
  };

  const filteredSteps = filterPhase === 'All' ? STEPS : STEPS.filter(s => s.phase === filterPhase);
  const pct = Math.round((completedSteps.length / STEPS.length) * 100);

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 32 }}>
        <h1 style={s.pageTitle}>Step-by-Step Implementation Guide</h1>
        <p style={s.pageSub}>
          Follow these {STEPS.length} steps to build the complete VPC peering architecture in the AWS Console.
          Check off each step as you complete it — progress is saved in your browser.
        </p>
      </div>

      {/* Progress */}
      <GlassCard accent style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 700 }}>Your Progress</span>
          <span style={{ fontWeight: 800, color: '#FF9900', fontSize: '1.2rem' }}>{pct}%</span>
        </div>
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
          {completedSteps.length} of {STEPS.length} steps completed
        </p>
      </GlassCard>

      {/* Phase filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {PHASES.map(phase => (
          <button
            key={phase}
            className={`btn btn-sm ${filterPhase === phase ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterPhase(phase)}
          >
            {phase}
          </button>
        ))}
        {completedSteps.length > 0 && (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => { setCompletedSteps([]); localStorage.removeItem('vpc_completed_steps'); }}
          >
            Reset Progress
          </button>
        )}
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredSteps.map(step => {
          const done = completedSteps.includes(step.id);
          const open = expandedStep === step.id;

          return (
            <GlassCard
              key={step.id}
              style={{
                padding: 0,
                borderLeft: done ? '4px solid #22c55e' : '4px solid rgba(255,255,255,0.1)',
                opacity: done ? 0.85 : 1,
              }}
            >
              {/* Header row */}
              <div
                style={s.stepHeader}
                onClick={() => setExpandedStep(open ? null : step.id)}
              >
                {/* Checkbox */}
                <button
                  style={s.checkbox(done)}
                  onClick={e => { e.stopPropagation(); toggleComplete(step.id); }}
                  aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {done ? '✓' : step.id}
                </button>

                {/* Icon + Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.1rem' }}>{step.icon}</span>
                    <span style={{
                      fontSize: '1rem', fontWeight: 700,
                      color: done ? 'rgba(255,255,255,0.4)' : '#fff',
                      textDecoration: done ? 'line-through' : 'none',
                    }}>
                      {step.title}
                    </span>
                    <span style={{
                      fontSize: '0.72rem', padding: '2px 8px', borderRadius: 99,
                      background: PHASE_COLORS[step.phase]?.bg,
                      color: PHASE_COLORS[step.phase]?.text,
                      border: `1px solid ${PHASE_COLORS[step.phase]?.border}`,
                      fontWeight: 600,
                    }}>
                      {step.phase}
                    </span>
                  </div>
                  {!open && (
                    <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.45)', marginTop: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {step.desc}
                    </p>
                  )}
                </div>

                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', flexShrink: 0 }}>
                  {open ? '▲' : '▼'}
                </span>
              </div>

              {/* Expanded content */}
              {open && (
                <div style={s.stepBody}>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 16 }}>
                    {step.desc}
                  </p>

                  {step.commands.length > 0 && (
                    <div style={s.cmdBox}>
                      {step.commands.map((cmd, i) => (
                        <div key={i} style={{
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          color: cmd.startsWith('#') ? '#64748b' : cmd === '' ? 'transparent' : '#86efac',
                          lineHeight: 1.6,
                          minHeight: cmd === '' ? '0.8rem' : 'auto',
                        }}>
                          {cmd || '\u00A0'}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={s.tipBox}>
                    <span style={{ fontSize: '0.9rem' }}>💡</span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                      {step.tip}
                    </span>
                  </div>

                  <button
                    className={`btn ${done ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                    style={{ marginTop: 4 }}
                    onClick={() => toggleComplete(step.id)}
                  >
                    {done ? '↩ Mark Incomplete' : '✓ Mark Complete'}
                  </button>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

const PHASE_COLORS = {
  Setup:   { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
  'VPC 1': { bg: 'rgba(29,78,216,0.15)',   text: '#93c5fd', border: 'rgba(29,78,216,0.3)' },
  'VPC 2': { bg: 'rgba(124,58,237,0.15)',  text: '#c4b5fd', border: 'rgba(124,58,237,0.3)' },
  Peering: { bg: 'rgba(255,153,0,0.15)',   text: '#fbbf24', border: 'rgba(255,153,0,0.3)' },
  Verify:  { bg: 'rgba(34,197,94,0.15)',   text: '#86efac', border: 'rgba(34,197,94,0.3)' },
};

const s = {
  pageTitle: { fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: 10 },
  pageSub:   { color: 'rgba(255,255,255,0.55)', fontSize: '1rem', maxWidth: 680, lineHeight: 1.7 },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: (done) => ({
    width: 36, height: 36, flexShrink: 0,
    borderRadius: '50%',
    border: `2px solid ${done ? '#22c55e' : 'rgba(255,255,255,0.25)'}`,
    background: done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
    color: done ? '#22c55e' : 'rgba(255,255,255,0.4)',
    fontSize: done ? '1rem' : '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  }),
  stepBody: {
    padding: '0 20px 20px 72px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 16,
  },
  cmdBox: {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 16,
  },
  tipBox: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    background: 'rgba(255,153,0,0.06)',
    border: '1px solid rgba(255,153,0,0.15)',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 16,
  },
};
