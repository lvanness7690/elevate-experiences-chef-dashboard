import React, { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import "./App.css";

const SHEET_ID = "1e0GPp6YR-YzydI1Loqz3RJJY3k66PdSl4gJikPc7d28";
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const RANGE = "Data";
const URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

const App = () => {
  const [chefs, setChefs] = useState([]);
  const [search, setSearch] = useState("");
  const [viewAll, setViewAll] = useState(false);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [selectedPartySize, setSelectedPartySize] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [quoteList, setQuoteList] = useState([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showPrice, setShowPrice] = useState(true);
  const [showPrivateDiningRoomCapacity, setShowPrivateDiningRoomCapacity] = useState(true);

  useEffect(() => {
    fetch(URL)
      .then(res => res.json())
      .then(data => {
        const rows = data.values;
        const headers = rows[0];
        const chefsData = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((key, i) => (obj[key] = row[i] || ""));
          return obj;
        });
        setChefs(chefsData);
      });
  }, []);

  const uniqueValues = key => [...new Set(chefs.map(c => c[key]).filter(Boolean))];

  const toggleSelection = (value, list, setter) => {
    if (list.includes(value)) {
      setter(list.filter(v => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  const matchesFilters = chef => {
    const genderMatch = selectedGenders.length === 0 || selectedGenders.includes(chef.Gender);
    const cityMatch = selectedCities.length === 0 || selectedCities.includes(chef.Location);
    const partyMatch = selectedPartySize === "" || chef["Capacity"] === selectedPartySize;
    const priceMatch = selectedPriceRange === "" || chef["Selling Range"] === selectedPriceRange;
    return genderMatch && cityMatch && partyMatch && priceMatch;
  };

  const filtered = chefs.filter(c =>
    `${c["Chef Name"]} ${c.Gender} ${c.Location} ${c.Bio} ${c["Restaurant/Venue"]}`.toLowerCase().includes(search.toLowerCase())
  );

  const displayedChefs = viewAll ? chefs.filter(matchesFilters) : filtered;

  const handleAddToQuote = chef => {
    if (!quoteList.find(c => c["Chef Name"] === chef["Chef Name"])) {
      setQuoteList([...quoteList, chef]);
    }
  };

  const handleRemoveFromQuote = chefName => {
    setQuoteList(quoteList.filter(chef => chef["Chef Name"] !== chefName));
  };

  const handleEmailQuote = () => {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      const content = document.getElementById("pdf-content").innerHTML;
      newWindow.document.write(`
     <html>
          <head>
            <title>Elevate Experiences - Chef Quote</title>
            <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter+Tight:wght@400;500&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Inter Tight', sans-serif;
                padding: 40px;
                color: #2D2D2D;
                background: #f5f5f5;
                text-align: center;
              }
              h1 {
                font-family: 'Archivo Black', sans-serif;
                text-transform: uppercase;
                font-size: 2rem;
                margin-bottom: 3rem;
              }
              .logo {
                width: 200px;
                margin: 60px auto;
                display: block;
              }
              .secondary-logo {
                width: 75px;
                margin: 40px auto 0;
                display: block;
              }
              .chef-card {
                display: flex;
                gap: 20px;
                margin-bottom: 30px;
                border-bottom: 2px solid #F26622;
                padding-bottom: 30px;
                max-width: 800px;
                margin-left: auto;
                margin-right: auto;
                text-align: left;
              }
              .headshot {
                width: 100px;
                height: 100px;
                object-fit: cover;
                border-radius: 50%;
              }
              .chef-info {
                flex-grow: 1;
              }
              .chef-info h2 {
                margin: 0 0 10px;
                font-family: 'Archivo Black', sans-serif;
                font-size: 1.2rem;
                text-transform: uppercase;
              }
              .chef-info p {
                margin: 4px 0;
              }
              .bullet-section {
                display: block;
                max-width: 600px;
                margin: 0 auto 40px;
                font-size: 1.1rem;
                line-height: 1.4;
                font-weight: 500;
                text-align: left;
              }
              .bullet-section p {
                margin: 6px 0;
                padding-left: 1.5em;
                text-indent: -1em;
              }
              .header-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
              }
              .logo-top-left {
                width: 180px;
                display: block;
              }
              .legal-top-right {
                font-size: 0.75rem;
                color: #555;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="header-row">
              <img src="/logo.png" alt="Elevate Logo" class="logo-top-left" />
              <div class="legal-top-right">© 2025 ELEVATE PROPRIETARY & CONFIDENTIAL.</div>
            </div>
            <h1>Celebrity Chef Dinner</h1>
            ${quoteList.map(chef => `
              <div class="chef-card">
                <img src="${chef.Headshot}" alt="${chef["Chef Name"]}" class="headshot" />
                <div class="chef-info">
                  <h2>${chef["Chef Name"]}</h2>
                  <p><strong>Location:</strong> ${chef.Location}</p>
                  <p>${chef.Bio}</p>
                  <p><strong>Restaurants:</strong> ${chef["Restaurant/Venue"] || "N/A"}</p>
                  ${showPrice ? `<p><strong>Total Investment:</strong> ${chef["Selling Range"] || "N/A"}</p>` : ""}
                </div>
              </div>
            `).join('')}
            <img src="/secondary.png" alt="Secondary Logo" class="secondary-logo" />
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleDownloadPDF = () => {
  const pdfContent = document.getElementById("pdf-content");
  
  // 1. Make it visible
  pdfContent.style.display = "block";

  const opt = {
    margin: 0,
    filename: "Elevate Chef Quote.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { 
      scale: 2,
      backgroundColor: "#f5f5f5", // match PDF background
      useCORS: true,    // allow loading images (important for Cloudinary URLs)
      allowTaint: true,
      logging: true
    },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
  };

  // 2. Generate the PDF
  html2pdf().set(opt).from(pdfContent).save()
    .then(() => {
      // 3. Hide it again after saving
      pdfContent.style.display = "none";
    })
    .catch((error) => {
      console.error("PDF generation error:", error);
      pdfContent.style.display = "none"; // hide even if error
    });
};

  return (
    <div className="container">
      <div className="sticky-container">
        <div className="header-bar">
          <img
            src="/secondary.png"
            alt="Secondary Logo"
            className="secondary-logo"
            onClick={() => {
              setSearch("");
              setViewAll(false);
              setSelectedGenders([]);
              setSelectedCities([]);
              setSelectedPartySize("");
              setSelectedPriceRange("");
            }}
          />
          {quoteList.length > 0 && (
            <div className="sticky-quote-button">
              <button className="quote-button" onClick={() => setShowQuoteModal(true)}>
                View Quote ({quoteList.length})
              </button>
            </div>
          )}
        </div>
      </div>

      <h1 className="title">Elevate Experiences<br />Chef Dashboard</h1>

      <div className="centered">
        <div className="top-buttons">
          <button onClick={() => setViewAll(true)} className="view-all-button">View All Chefs</button>
        </div>

        <input
          type="text"
          placeholder="Search by name, gender, location, or bio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-bar"
        />

        <p className="instructions">
          Start typing to explore our featured chefs. You can search by <strong>name</strong>, <strong>gender</strong>, <strong>location</strong>, or key terms from their <strong>bio</strong>.<br />
          <em>Examples: “female”, “New York”, “barbecue”</em>
        </p>
      </div>

      {viewAll && (
        <div className="filters" style={{ marginBottom: '60px' }}>
          {/* Gender Filter */}
          <div
            className="dropdown-group"
            onMouseEnter={() => setShowGenderDropdown(true)}
            onMouseLeave={() => setShowGenderDropdown(false)}
          >
            <button>Gender ▾</button>
            {showGenderDropdown && (
              <div className="dropdown-panel">
                {uniqueValues("Gender").map((gender, i) => (
                  <label key={i} className="dropdown-option">
                    <input
                      type="checkbox"
                      checked={selectedGenders.includes(gender)}
                      onChange={() => toggleSelection(gender, selectedGenders, setSelectedGenders)}
                    />{" "}
                    {gender}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* City Filter */}
          <div
            className="dropdown-group"
            onMouseEnter={() => setShowCityDropdown(true)}
            onMouseLeave={() => setShowCityDropdown(false)}
          >
            <button>City ▾</button>
            {showCityDropdown && (
              <div className="dropdown-panel">
                {uniqueValues("Location").sort((a, b) => a.localeCompare(b)).map((city, i) => (
                  <label key={i} className="dropdown-option">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city)}
                      onChange={() => toggleSelection(city, selectedCities, setSelectedCities)}
                    />{" "}
                    {city}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Party Size Filter */}
          <div
            className="dropdown-group"
            onMouseEnter={() => setShowPartyDropdown(true)}
            onMouseLeave={() => setShowPartyDropdown(false)}
          >
            <button>Party Size ▾</button>
            {showPartyDropdown && (
              <div className="dropdown-panel">
                {["15-25", "25-50", "50+"].map((size, i) => (
                  <label key={i} className="dropdown-option">
                    <input
                      type="radio"
                      name="partySize"
                      value={size}
                      checked={selectedPartySize === size}
                      onChange={() => setSelectedPartySize(size)}
                    />{" "}
                    {size}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Filter */}
          <div
            className="dropdown-group"
            onMouseEnter={() => setShowPriceDropdown(true)}
            onMouseLeave={() => setShowPriceDropdown(false)}
          >
            <button>Price Range ▾</button>
            {showPriceDropdown && (
              <div className="dropdown-panel">
                {[
                  "$20,000 - $30,000",
                  "$30,000 - $40,000",
                  "$40,000 - $50,000",
                  "$50,000 - $75,000",
                  "$75,000 - $100,000",
                  "$100,000+"
                ].map((price, i) => (
                  <label key={i} className="dropdown-option">
                    <input
                      type="radio"
                      name="priceRange"
                      value={price}
                      checked={selectedPriceRange === price}
                      onChange={() => setSelectedPriceRange(price)}
                    />{" "}
                    {price}
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Clear Filters Button */}
          <div className="dropdown-group">
            <button onClick={() => {
              setSelectedGenders([]);
              setSelectedCities([]);
              setSelectedPartySize("");
              setSelectedPriceRange("");
            }}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="chef-list">
        {(search || viewAll) && displayedChefs.length > 0 ? (
          displayedChefs.map((chef, index) => (
            <div key={index} className="chef-card">
              <img src={chef.Headshot} alt={chef["Chef Name"]} className="headshot" />
              <div className="chef-info">
                <div
                  className="chef-header"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <h2 style={{ margin: 0 }}>{chef["Chef Name"]}</h2>
                  <button
                    className="add-to-quote-button"
                    title="Add to Quote"
                    onClick={() => handleAddToQuote(chef)}
                  >
                    +
                  </button>
                </div>
                <p><strong>Location:</strong> {chef.Location}</p>
                <p>{chef.Bio}</p>
                <p><strong>Restaurants:</strong> {chef["Restaurant/Venue"] || "N/A"}</p>
                <p><strong>Private Dining Room Capacity:</strong> {chef["Private Dining Room Capacity"] || "N/A"}</p>
                <p><strong>Price:</strong> {chef["Selling Range"] || "N/A"}</p>
              </div>
            </div>
          ))
        ) : (search || viewAll) ? (
          <p>No chefs match your search.</p>
        ) : null}
      </div>

      {/* Modal for Quote */}
      {showQuoteModal && (
        <div className="modal">
          <button className="close-button" onClick={() => setShowQuoteModal(false)}>×</button>
          <div className="modal-logo-container">
            <img src="/logo.png" alt="Elevate Logo" className="modal-logo" />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              className="toggle-button"
              onClick={() => setShowPrice(!showPrice)}
            >
              {showPrice ? "Hide Price" : "Show Price"}
            </button>
            <button
              className="toggle-button"
              onClick={() => setShowPrivateDiningRoomCapacity(!showPrivateDiningRoomCapacity)}
              style={{ marginLeft: '10px' }}
            >
              {showPrivateDiningRoomCapacity ? "Hide Capacity" : "Show Capacity"}
            </button>
            <button
              className="toggle-button"
              onClick={() => setQuoteList([])}
              style={{ marginLeft: '10px' }}
            >
              Clear Quote
            </button>
          </div>
          {quoteList.map((chef, i) => (
            <div key={i} className="chef-card">
              <img src={chef.Headshot} alt={chef["Chef Name"]} className="headshot" />
              <div className="chef-info">
                <div className="chef-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>{chef["Chef Name"]}</h2>
                  <button
                    className="remove-x-button"
                    title="Remove from quote"
                    onClick={() => handleRemoveFromQuote(chef["Chef Name"])}
                  >
                    ×
                  </button>
                </div>
                <p><strong>Location:</strong> {chef.Location}</p>
                <p>{chef.Bio}</p>
                <p><strong>Restaurants:</strong> {chef["Restaurant/Venue"] || "N/A"}</p>
                {showPrivateDiningRoomCapacity && <p><strong>Private Dining Room Capacity:</strong> {chef["Private Dining Room Capacity"] || "N/A"}</p>}
                {showPrice && <p><strong>Price:</strong> {chef["Selling Range"] || "N/A"}</p>}
              </div>
            </div>
          ))}
          <div className="modal-buttons">
            <button className="quote-button" onClick={handleEmailQuote}>Email Quote</button>
            <button className="quote-button" onClick={handleDownloadPDF}>Download PDF</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <img src="/logo.png" alt="Elevate Logo" className="logo" />
      </footer>

      {/* Hidden PDF Content */}
      <div
        id="pdf-content"
        style={{
          display: "none",
          minHeight: "11in",
          height: "11in",
          width: "8.5in",
          backgroundColor: "#f5f5f5",
          boxSizing: "border-box",
          padding: "0.25in"
        }}
      >
        <style>
          {`
#pdf-content {
  font-family: 'Inter Tight', sans-serif;
  color: #2D2D2D;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 11in;
  height: 11in;
  width: 8.5in;
  padding: 0.25in;
  box-sizing: border-box;
  background-color: #f5f5f5;
}
#pdf-content h1 {
  font-family: 'Archivo Black', sans-serif;
  text-transform: uppercase;
  font-size: 2rem;
  margin: 1.5rem 0 2.5rem 0;
}
#pdf-content .logo-top-left {
  width: 150px;
  display: block;
  margin-bottom: 1rem;
}
#pdf-content .secondary-logo {
  width: 75px;
  display: block;
  margin: 2rem auto 0;
}
#pdf-content .chef-card {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  border-bottom: 2px solid #F26622;
  padding-bottom: 20px;
  max-width: 750px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
}
#pdf-content .headshot {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
}
#pdf-content .chef-info {
  flex-grow: 1;
}
#pdf-content .chef-info h2 {
  margin: 0 0 10px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.2rem;
  text-transform: uppercase;
}
#pdf-content .chef-info p {
  margin: 4px 0;
}
#pdf-content .header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-top: 15px;
}
#pdf-content .legal-top-right {
  font-size: 0.75rem;
  color: #555;
  margin-top: 10px;
}
          `}
        </style>

        <div className="header-row">
          <img src="/logo.png" alt="Elevate Logo" className="logo-top-left" />
          <div className="legal-top-right">© 2025 ELEVATE PROPRIETARY & CONFIDENTIAL.</div>
        </div>
        <h1>Celebrity Chef Dinner</h1>
        <div>
          {quoteList.map((chef, i) => (
            <div key={i} className="chef-card">
              <img src={chef.Headshot} alt={chef["Chef Name"]} className="headshot" />
              <div className="chef-info">
                <h2>{chef["Chef Name"]}</h2>
                <p><strong>Location:</strong> {chef.Location}</p>
                <p>{chef.Bio}</p>
                <p><strong>Restaurants:</strong> {chef["Restaurant/Venue"] || "N/A"}</p>
                {showPrivateDiningRoomCapacity && <p><strong>Private Dining Room Capacity:</strong> {chef["Private Dining Room Capacity"] || "N/A"}</p>}
                {showPrice && <p><strong>Total Investment:</strong> {chef["Selling Range"] || "N/A"}</p>}
              </div>
            </div>
          ))}
        </div>
        <img src="/secondary.png" alt="Secondary Logo" className="secondary-logo" />
      </div>
    </div>
  );
};

export default App;