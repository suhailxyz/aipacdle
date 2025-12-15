export function ResourcesScreen() {
  return (
    <div className="resources-screen">
      <div className="resources-content">

        
        <div className="resources-list">
          <div className="resource-item">
            <h2>Palestine Children's Relief Fund (PCRF)</h2>
            <p>Medical care and humanitarian aid for children in Gaza and the West Bank.</p>
            <a href="https://www.pcrf.net" target="_blank" rel="noopener noreferrer" className="resource-link">
              Support →
            </a>
          </div>

          <div className="resource-item">
            <h2>UN Crisis Relief — Occupied Palestinian Territory Humanitarian Fund</h2>
            <p>UN-managed fund providing urgent food, medical, water, and shelter to Palestinians in Gaza and the West Bank.</p>
            <a href="https://crisisrelief.un.org/en/donate-opt-crisis" target="_blank" rel="noopener noreferrer" className="resource-link">
              Support →
            </a>
          </div>

          <div className="resource-item">
            <h2>United Nations Relief and Works Agency (UNRWA) USA</h2>
            <p>U.S. nonprofit supporting the United Nations Relief and Works Agency (UNRWA), providing education, health care, and food assistance to Palestinian refugees.</p>
            <a href="https://www.unrwausa.org" target="_blank" rel="noopener noreferrer" className="resource-link">
              Support →
            </a>
          </div>
        </div>
      </div>
      <div className="resources-heart">❤️</div>
    </div>
  );
}

