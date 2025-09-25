'use client';
import React from 'react';

interface InfoTooltipProps {
  label: string;
  children: React.ReactNode; // tooltip content
  inline?: boolean;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ label, children, inline }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ position: 'relative', display: inline ? 'inline-flex' : 'inline-block', alignItems: 'center' }}
      onMouseEnter={()=> setOpen(true)}
      onMouseLeave={()=> setOpen(false)}
      onFocus={()=> setOpen(true)}
      onBlur={()=> setOpen(false)}
    >
      <span aria-label={`Info about ${label}`} role="button" tabIndex={0} style={{
        display: 'inline-flex', justifyContent:'center', alignItems:'center', width: 14, height:14,
        fontSize: 10, borderRadius: '50%', background:'var(--color-ocean)', color:'var(--color-shell)', cursor:'help',
        fontWeight: 600, marginLeft: 4
      }}>i</span>
      {open && (
        <div style={{ position: 'absolute', zIndex: 20, top: '110%', left: '50%', transform:'translateX(-50%)', background:'var(--color-onyx)', color:'var(--color-shell)', padding: '0.5rem 0.6rem', lineHeight:1.3, fontSize: 11, borderRadius:4, boxShadow:'0 4px 10px rgba(0,0,0,0.25)', minWidth: 220, maxWidth: 300 }}>
          {children}
        </div>
      )}
    </span>
  );
};
export default InfoTooltip;
