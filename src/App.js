import React, { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import "./App.css";

const SHEET_ID = "1e0GPp6YR-YzydI1Loqz3RJJY3k66PdSl4gJikPc7d28";
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const RANGE = "Data";
const URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

// Utility to generate a random ID for quote sharing
function generateQuoteId() {
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

// Try to detect if the URL is /quote/:id
function getQuoteIdFromPath() {
  const match = window.location.pathname.match(/^\/quote\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

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
  const [selectedGroupSize, setSelectedGroupSize] = useState("");
  // Returns the price for the selected group size
  const getPriceForGroupSize = (chef) => {
    if (selectedGroupSize === "25-50") {
      return chef["Selling Range (25 - 50)"] || "N/A";
    } else if (selectedGroupSize === "50+") {
      return chef["Selling Range (50+)"] || "N/A";
    } else {
      // Default if none selected or 15-25 selected
      return chef["Selling Range (15 - 25)"] || "N/A";
    }
  };

  // If on /quote/:id, load quote data from localStorage and render quote page
  const quoteIdFromUrl = getQuoteIdFromPath();
  useEffect(() => {
    if (quoteIdFromUrl) {
      // Only fetch chef data if not already loaded (for logo, names, etc.)
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
    } else {
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
    }
    // eslint-disable-next-line
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

  const displayedChefs = viewAll ? filtered.filter(matchesFilters) : filtered;

  const handleAddToQuote = chef => {
    if (!quoteList.find(c => c["Chef Name"] === chef["Chef Name"])) {
      setQuoteList([...quoteList, chef]);
    }
  };

  const handleRemoveFromQuote = chefName => {
    setQuoteList(quoteList.filter(chef => chef["Chef Name"] !== chefName));
  };

  const handleEmailQuote = () => {
    // Generate unique ID for this quote
    const quoteId = generateQuoteId();
    // Save quote data (chefs and settings) to localStorage
    const dataToSave = {
      quoteList,
      showPrice,
      showPrivateDiningRoomCapacity,
      selectedGroupSize
    };
    localStorage.setItem("elevate_quote_" + quoteId, JSON.stringify(dataToSave));
    // Generate shareable link
    const origin = window.location.origin;
    const shareUrl = `${origin}/quote/${quoteId}`;
    // Optionally: open the share page in a new tab
    window.open(shareUrl, "_blank");
    // Optionally: open mail client with the link
    setTimeout(() => {
      window.location.href =
        "mailto:?subject=Elevate Chef Quote&body=View the quote here: " + encodeURIComponent(shareUrl);
    }, 300);
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

  // If on /quote/:id, render the quote page using localStorage data
  if (quoteIdFromUrl) {
    // Try to load from localStorage
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("elevate_quote_" + quoteIdFromUrl));
    } catch (e) {
      stored = null;
    }
    // If not found, show error
    if (!stored) {
      return (
        <div style={{ padding: 40, textAlign: "center" }}>
          <img src="/logo.png" alt="Elevate Logo" style={{ width: 200, marginBottom: 32 }} />
          <h2>Quote Not Found</h2>
          <p>This quote link is invalid or has expired.</p>
        </div>
      );
    }
    // Render quote page
    return (
      <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, padding: "40px 40px 0 40px" }}>
          <img src="/logo.png" alt="Elevate Logo" style={{ width: 180 }} />
          <div style={{ fontSize: "0.75rem", color: "#555", marginTop: 10 }}>© 2025 ELEVATE PROPRIETARY & CONFIDENTIAL.</div>
        </div>
        <h1 style={{
          fontFamily: "'Archivo Black', sans-serif",
          textTransform: "uppercase",
          fontSize: "2rem",
          margin: "0 0 2.5rem 0",
          textAlign: "center"
        }}>
          Celebrity Chef Dinner
        </h1>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {stored.quoteList && stored.quoteList.length > 0 ? (
            stored.quoteList.map((chef, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 20,
                marginBottom: 30,
                borderBottom: "2px solid #F26622",
                paddingBottom: 30,
                maxWidth: 800,
                marginLeft: "auto",
                marginRight: "auto",
                textAlign: "left",
                background: "#F5F5F5",
                borderRadius: 0,
                boxShadow: "none"
              }}>
                <img src={chef.Headshot} alt={chef["Chef Name"]} style={{
                  width: 100,
                  height: 100,
                  objectFit: "cover",
                  borderRadius: "50%"
                }} />
                <div style={{ flexGrow: 1 }}>
                  <h2 style={{
                    margin: "0 0 10px 0",
                    fontFamily: "'Archivo Black', sans-serif",
                    fontSize: "1.2rem",
                    textTransform: "uppercase"
                  }}>{chef["Chef Name"]}</h2>
                  <p><strong>Location:</strong> {chef.Location}</p>
                  <p>{chef.Bio}</p>
                  <p><strong>Restaurants:</strong> {chef["Restaurant/Venue"] || "N/A"}</p>
                  {stored.showPrivateDiningRoomCapacity && <p><strong>Private Dining Room Capacity:</strong> {chef["Private Dining Room Capacity"] || "N/A"}</p>}
                  {stored.showPrice && (
                    <p><strong>Total Investment:</strong> {(() => {
                      if (stored.selectedGroupSize === "25-50") {
                        return (chef["Selling Range (25 - 50)"] || "N/A") + " (Based on 25-50 Guests)";
                      } else if (stored.selectedGroupSize === "50+") {
                        return (chef["Selling Range (50+)"] || "N/A") + " (Based on 50+ Guests)";
                      } else {
                        return (chef["Selling Range (15 - 25)"] || "N/A") + " (Based on 15-25 Guests)";
                      }
                    })()}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No chefs in this quote.</p>
          )}
        </div>
        <img src="/secondary.png" alt="Secondary Logo" style={{ width: 75, display: "block", margin: "60px auto 0" }} />
      </div>
    );
  }

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

{(viewAll || search) && (
  <div className="group-size-select">
    <strong>Select Group Size:</strong>
    <label>
      <input
        type="radio"
        name="groupSize"
        value="15-25"
        checked={selectedGroupSize === "15-25"}
        onChange={() => setSelectedGroupSize("15-25")}
      />
      15-25 Guests
    </label>
    <label>
      <input
        type="radio"
        name="groupSize"
        value="25-50"
        checked={selectedGroupSize === "25-50"}
        onChange={() => setSelectedGroupSize("25-50")}
      />
      25-50 Guests
    </label>
    <label>
      <input
        type="radio"
        name="groupSize"
        value="50+"
        checked={selectedGroupSize === "50+"}
        onChange={() => setSelectedGroupSize("50+")}
      />
      50+ Guests
    </label>
  </div>
)}

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
            <button>Capacity ▾</button>
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
                {chef["Case Study"] && (
                  <p>
                    <strong>Case Study:</strong>{" "}
                    <a href={chef["Case Study"]} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                  </p>
                )}
                <p><strong>Restaurants:</strong> {chef["Restaurant/Venue"] || "N/A"}</p>
                <p><strong>Private Dining Room Capacity:</strong> {chef["Private Dining Room Capacity"] || "N/A"}</p>
                <p><strong>Price:</strong> {getPriceForGroupSize(chef)} (Based on {selectedGroupSize || "15-25"} Guests)</p>
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
                {showPrice && (
                  <p><strong>Total Investment:</strong> {(() => {
                    if (selectedGroupSize === "25-50") {
                      return (chef["Selling Range (25 - 50)"] || "N/A") + " (Based on 25-50 Guests)";
                    } else if (selectedGroupSize === "50+") {
                      return (chef["Selling Range (50+)"] || "N/A") + " (Based on 50+ Guests)";
                    } else {
                      return (chef["Selling Range (15 - 25)"] || "N/A") + " (Based on 15-25 Guests)";
                    }
                  })()}</p>
                )}
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
                {showPrice && (
                  <p><strong>Total Investment:</strong> {getPriceForGroupSize(chef)} (Based on {selectedGroupSize || "15-25"} Guests)</p>
                )}
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