import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Generates and shares a PDF report of time entries
 * @param {Array} selectedTimeEntries - Array of selected time entries
 * @param {String} dateRangeText - Text describing the date range
 * @param {Function} formatTime - Function to format time in milliseconds to readable format
 */
export const generateAndSharePDF = async (selectedTimeEntries, dateRangeText, formatTime) => {
  try {
    if (selectedTimeEntries.length === 0) {
      Alert.alert('No Entries Selected', 'Please select at least one time entry to export.');
      return;
    }
    
    // Show loading indicator
    Alert.alert('Generating PDF', 'Please wait while your PDF is being generated...');
    
    const html = generateReportHTML(selectedTimeEntries, dateRangeText, formatTime);
    
    const { uri } = await Print.printToFileAsync({ 
      html,
      base64: false,
      width: 612, // Standard US Letter width in points (8.5 inches)
      height: 792, // Standard US Letter height in points (11 inches)
    });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Time Tracking Report',
        UTI: 'com.adobe.pdf'
      });
    } else {
      Alert.alert('Sharing Not Available', 'Sharing is not available on your platform');
    }
  } catch (error) {
    Alert.alert('Export Error', `An error occurred: ${error.message}`);
  }
};

/**
 * Generates HTML for the PDF report
 */
const generateReportHTML = (selectedTimeEntries, dateRangeText, formatTime) => {
  if (selectedTimeEntries.length === 0) {
    return '<h1>No entries selected</h1>';
  }

  // Calculate total time
  const totalTime = selectedTimeEntries.reduce((total, entry) => total + entry.duration, 0);
  const formattedTotalTime = formatTime(totalTime);
  
  // Group entries by customer
  const entriesByCustomer = {};
  selectedTimeEntries.forEach(entry => {
    if (!entriesByCustomer[entry.customer]) {
      entriesByCustomer[entry.customer] = [];
    }
    entriesByCustomer[entry.customer].push(entry);
  });

  // Group entries by description within each customer
  const entriesByCustomerAndDescription = {};
  Object.keys(entriesByCustomer).forEach(customer => {
    entriesByCustomerAndDescription[customer] = {};
    
    entriesByCustomer[customer].forEach(entry => {
      if (!entriesByCustomerAndDescription[customer][entry.description]) {
        entriesByCustomerAndDescription[customer][entry.description] = [];
      }
      entriesByCustomerAndDescription[customer][entry.description].push(entry);
    });
  });

  // Calculate total hours per customer for pie chart data
  const customerTotals = {};
  Object.keys(entriesByCustomer).forEach(customer => {
    const customerTotal = entriesByCustomer[customer].reduce((total, entry) => total + entry.duration, 0);
    customerTotals[customer] = customerTotal;
  });

  // Generate random colors for the pie chart
  const pieChartColors = {};
  Object.keys(customerTotals).forEach(customer => {
    pieChartColors[customer] = generateRandomColor();
  });

  let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Time Tracking Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            line-height: 1.6;
            color: #333;
            background-color: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          
          .header {
            position: relative;
            margin-bottom: 40px;
          }
          
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f3f4f6;
          }
          
          .header-left {
            flex: 1;
          }
          
          .header-right {
            text-align: right;
            flex: 1;
          }
          
          .logo {
            font-size: 28px;
            font-weight: 700;
            color: #4f46e5;
            letter-spacing: -0.5px;
          }
          
          .report-title {
            font-size: 36px;
            font-weight: 800;
            color: #111827;
            margin: 20px 0 15px 0;
            letter-spacing: -1px;
          }
          
          .date-generated {
            font-size: 14px;
            color: #6b7280;
            margin-top: 5px;
          }
          
          .date-range {
            display: inline-block;
            font-size: 15px;
            font-weight: 600;
            color: #4f46e5;
            margin: 15px 0;
            padding: 8px 16px;
            background-color: #eef2ff;
            border-radius: 30px;
          }
          
          .summary-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          
          .summary-card {
            flex: 1;
            background: linear-gradient(135deg, #4f46e5, #6366f1);
            color: white;
            padding: 25px;
            border-radius: 16px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            max-width: 300px;
          }
          
          .summary-title {
            font-size: 16px;
            font-weight: 500;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .summary-total {
            font-size: 36px;
            font-weight: 700;
            margin-top: 10px;
          }
          
          .chart-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            background-color: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #f3f4f6;
          }
          
          .pie-chart {
            width: 200px;
            height: 200px;
            position: relative;
            border-radius: 50%;
            overflow: hidden;
            background: conic-gradient(
              ${Object.keys(customerTotals).map((customer, index, array) => {
                const percentage = (customerTotals[customer] / totalTime) * 100;
                const previousPercentages = array.slice(0, index).reduce((acc, curr) => {
                  return acc + (customerTotals[curr] / totalTime) * 100;
                }, 0);
                return `${pieChartColors[customer]} ${previousPercentages}% ${previousPercentages + percentage}%`;
              }).join(', ')}
            );
            margin: 0 auto;
          }
          
          .chart-legend {
            flex: 1;
            margin-left: 30px;
          }
          
          .legend-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #111827;
          }
          
          .legend-items {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
          }
          
          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            margin-right: 10px;
          }
          
          .legend-label {
            font-size: 14px;
            color: #4b5563;
          }
          
          .legend-value {
            margin-left: auto;
            font-weight: 600;
            color: #111827;
          }
          
          .customer-section {
            margin-bottom: 40px;
            background-color: white;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #f3f4f6;
          }
          
          .customer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f3f4f6;
          }
          
          .customer-name {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
          }
          
          .customer-total {
            font-size: 18px;
            font-weight: 600;
            color: #4f46e5;
            background-color: #eef2ff;
            padding: 8px 16px;
            border-radius: 12px;
          }
          
          .description-section {
            margin-bottom: 25px;
            background-color: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #f3f4f6;
          }
          
          .description-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .description-title {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
          }
          
          .description-total {
            font-size: 16px;
            font-weight: 600;
            color: #059669;
            background-color: #ecfdf5;
            padding: 6px 12px;
            border-radius: 8px;
          }
          
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 10px;
            font-size: 14px;
          }
          
          th {
            background-color: #f3f4f6;
            text-align: left;
            padding: 12px 15px;
            font-weight: 600;
            color: #4b5563;
            border-bottom: 1px solid #e5e7eb;
            border-top: 1px solid #e5e7eb;
          }
          
          th:first-child {
            border-left: 1px solid #e5e7eb;
            border-top-left-radius: 8px;
          }
          
          th:last-child {
            border-right: 1px solid #e5e7eb;
            border-top-right-radius: 8px;
          }
          
          td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
            color: #4b5563;
          }
          
          td:first-child {
            border-left: 1px solid #e5e7eb;
          }
          
          td:last-child {
            border-right: 1px solid #e5e7eb;
          }
          
          tr:last-child td:first-child {
            border-bottom-left-radius: 8px;
          }
          
          tr:last-child td:last-child {
            border-bottom-right-radius: 8px;
          }
          
          .time-cell {
            font-weight: 500;
            color: #4f46e5;
          }
          
          .type-cell {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          
          .type-manual {
            background-color: #eef2ff;
            color: #4f46e5;
          }
          
          .type-automatic {
            background-color: #f0fdf4;
            color: #059669;
          }
          
          .total-summary {
            margin-top: 50px;
            background-color: #f0fdf4;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            border: 1px solid #d1fae5;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .total-summary-title {
            font-size: 20px;
            font-weight: 600;
            color: #059669;
            margin-bottom: 15px;
          }
          
          .total-summary-value {
            font-size: 36px;
            font-weight: 700;
            color: #059669;
          }
          
          .footer {
            margin-top: 60px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          
          .page-break {
            page-break-after: always;
          }
          
          @media print {
            body {
              font-size: 12pt;
            }
            
            .container {
              padding: 0;
              max-width: 100%;
            }
            
            .customer-section {
              page-break-inside: avoid;
            }
            
            .description-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-top">
              <div class="header-left">
                <div class="logo">Time Account App</div>
                <div class="date-range">${dateRangeText}</div>
              </div>
              <div class="header-right">
                <div class="date-generated">Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
              </div>
            </div>
            <h1 class="report-title">Time Tracking Report</h1>
          </div>
          
          <div class="summary-section">
            <div class="summary-card">
              <div class="summary-title">Total Hours</div>
              <div class="summary-total">${formattedTotalTime}</div>
            </div>
          </div>
          
          <div class="chart-container">
            <div class="pie-chart"></div>
            <div class="chart-legend">
              <h3 class="legend-title">Time Distribution by Customer</h3>
              <div class="legend-items">
                ${Object.keys(customerTotals).map(customer => {
                  const percentage = ((customerTotals[customer] / totalTime) * 100).toFixed(1);
                  return `
                    <div class="legend-item">
                      <div class="legend-color" style="background-color: ${pieChartColors[customer]}"></div>
                      <div class="legend-label">${customer}</div>
                      <div class="legend-value">${formatTime(customerTotals[customer])} (${percentage}%)</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
  `;

  // Add customer sections
  Object.keys(entriesByCustomerAndDescription).forEach((customer, customerIndex) => {
    const customerEntries = entriesByCustomer[customer];
    const customerTotal = customerEntries.reduce((total, entry) => total + entry.duration, 0);
    const customerColor = pieChartColors[customer];
    
    html += `
      <div class="customer-section">
        <div class="customer-header">
          <div class="customer-name">
            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${customerColor}; margin-right: 8px; border-radius: 2px;"></span>
            ${customer}
          </div>
          <div class="customer-total">Total: ${formatTime(customerTotal)}</div>
        </div>
    `;
    
    // Add description sections within each customer
    Object.keys(entriesByCustomerAndDescription[customer]).forEach((description, descIndex) => {
      const descriptionEntries = entriesByCustomerAndDescription[customer][description];
      const descriptionTotal = descriptionEntries.reduce((total, entry) => total + entry.duration, 0);
      const percentOfCustomer = ((descriptionTotal / customerTotal) * 100).toFixed(1);
      
      html += `
        <div class="description-section">
          <div class="description-header">
            <div class="description-title">${description}</div>
            <div class="description-total">Total: ${formatTime(descriptionTotal)} (${percentOfCustomer}%)</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Start Time</th>
                <th>Duration</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // Sort entries by date (newest first)
      const sortedEntries = [...descriptionEntries].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      sortedEntries.forEach(entry => {
        const entryDate = new Date(entry.timestamp);
        const formattedDate = entryDate.toLocaleDateString();
        const formattedTime = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const entryType = entry.type === 'manual' ? 'Manual Entry' : 'Timer';
        const typeClass = entry.type === 'manual' ? 'type-manual' : 'type-automatic';
        
        html += `
          <tr>
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td class="time-cell">${formatTime(entry.duration)}</td>
            <td><span class="type-cell ${typeClass}">${entryType}</span></td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    });
    
    html += `
      </div>
      ${customerIndex < Object.keys(entriesByCustomerAndDescription).length - 1 ? '<div class="page-break"></div>' : ''}
    `;
  });

  html += `
          <div class="total-summary">
            <div class="total-summary-title">Total Time Tracked</div>
            <div class="total-summary-value">${formattedTotalTime}</div>
          </div>
          
          <div class="footer">
            <p>This report was generated by Time Account App. All times are displayed in hours and minutes.</p>
            <p>© ${new Date().getFullYear()} Time Account App</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return html;
};

// Helper function to generate random colors for the pie chart
const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};
