import fs from 'fs';

// Function to parse X12 data into JSON
function parseX12ToJSON(x12) {
  const segments = x12.split('~').map((segment) => segment.trim());

  const json = {};
  let currentObject = json;

  segments.forEach((segment) => {
    const [segmentId, ...elements] = segment.split('|');
    if (segmentId === 'HL') {
      currentObject.HL = currentObject.HL || [];
      currentObject.HL.push({ HL: elements });
      currentObject = currentObject.HL[currentObject.HL.length - 1];
    } else {
      currentObject[segmentId] = elements;
    }
  });

  return json;
}
function edi856ToJSON(x12) {
  const segments = x12.split('~').map((segment) => segment.trim());
  const json = {};
  const hlMap = {}; // To keep track of parent HL segments
  const parentCandidates = {}; // To track potential parent segments
  let currentObject = json;
  let currentHL = null;
  let hasChild = false; // Declare hasChild outside the switch statement
  let hlId=null;
  segments.forEach((segment) => {
    const [segmentId, ...elements] = segment.split('|');

    switch (segmentId) {
      case 'HL':
        hlId = elements[0]; // Get the HL segment identifier
        const hlType = elements[2]; // Get the type of HL segment
        const parentSegment = elements[1]; // Get the parent segment identifier
        hasChild = elements[3] === '1'; // Update hasChild here

        // Check if this HL segment should be associated with a potential parent
        if (parentCandidates[hlId]) {
          const parentHL = parentCandidates[hlId];
          parentHL.HL = parentHL.HL || [];
          parentHL.HL.push({
            HL: elements,
            Type: hlType,
            UniqueIdentifier: hlId,
            ParentSegment: parentSegment,
            HasChild: hasChild,
          });
          currentObject = parentHL.HL[parentHL.HL.length - 1];
          // Remove this HL segment from potential parents
          delete parentCandidates[hlId];
        } else if (hlMap[hlId]) {
          // Check if this HL segment should be a child
          const parentHL = hlMap[hlId];
          parentHL.HL = parentHL.HL || [];
          parentHL.HL.push({
            HL: elements,
            Type: hlType,
            UniqueIdentifier: hlId,
            ParentSegment: parentSegment,
            HasChild: hasChild,
          });
          currentObject = parentHL.HL[parentHL.HL.length - 1];
        } else {
          // No parent, make it a top-level HL segment
          currentHL = {
            HL: elements,
            Type: hlType,
            UniqueIdentifier: hlId,
            ParentSegment: parentSegment,
            HasChild: hasChild,
          };
          json.HL = json.HL || [];
          json.HL.push(currentHL);
          currentObject = currentHL;
        }

        // Update the hlMap to track this HL segment
        hlMap[elements[0]] = currentObject;
        break;
      case 'TD1':
        currentHL.TD1 = elements;
        break;
      case 'TD5':
        currentHL.TD5 = elements;
        break;
      case 'REF':
        if (!currentHL.REF) {
          currentHL.REF = [];
        }
        currentHL.REF.push(elements);
        break;
      case 'N1':
        if (!currentHL.N1) {
          currentHL.N1 = [];
        }
        currentHL.N1.push(elements);
        break;
      case 'YNQ':
        if (!currentHL.YNQ) {
          currentHL.YNQ = [];
        }
        currentHL.YNQ.push(elements);
        break;
      case 'CTT':
        currentObject.CTT = elements;
        break;
      case 'PRF':
        currentHL.PRF = elements;
        break;
      default:
        currentObject[segmentId] = elements;
    }

    // If the segment has a child, add it as a potential parent
    if (hasChild) {
      parentCandidates[hlId] = currentObject;
    }
  });

  return json;

}
function convertX12ToJSON(x12) {
  const segments = x12.split('~').map((segment) => segment.trim());
  const json = {};
  const hlMap = {}; // To keep track of parent HL segments

  let currentObject = json;
  let currentHL = null;

  segments.forEach((segment) => {
    const [segmentId, ...elements] = segment.split('|');

    switch (segmentId) {
      case 'HL':
        const hlId = elements[1]; // Get the HL segment identifier

        // Check if the HL segment should be a child
        if (hlMap[hlId]) {
          const parentHL = hlMap[hlId];
          parentHL.HL = parentHL.HL || [];
          parentHL.HL.push({ HL: elements });
          currentObject = parentHL.HL[parentHL.HL.length - 1];
        } else {
          // No parent, make it a top-level HL segment
          currentHL = { HL: elements };
          json.HL = json.HL || [];
          json.HL.push(currentHL);
          currentObject = currentHL;
        }

        // Update the hlMap to track this HL segment
        hlMap[elements[0]] = currentObject;
        break;
      case 'TD1':
        currentHL.TD1 = elements;
        break;
      case 'TD5':
        currentHL.TD5 = elements;
        break;
      case 'REF':
        if (!currentHL.REF) {
          currentHL.REF = [];
        }
        currentHL.REF.push(elements);
        break;
      case 'N1':
        if (!currentHL.N1) {
          currentHL.N1 = [];
        }
        currentHL.N1.push(elements);
        break;
      case 'YNQ':
        if (!currentHL.YNQ) {
          currentHL.YNQ = [];
        }
        currentHL.YNQ.push(elements);
        break;
      case 'CTT':
        currentObject.CTT = elements;
        break;
      default:
        currentObject[segmentId] = elements;
    }
  });

  return json;
}
function extractDataFromJSON(jsonData) {
  const extractedData = [];

  // Iterate over HL segments
  jsonData.HL.forEach((hlSegment) => {
    const data = {};

    // Check the HL01 segment for the level type
    const levelType = hlSegment.HL[0];
    console.log('LEVELTYPE', levelType);
    console.log('hlSegment.HL', hlSegment.HL);
    // Use the level type to determine the data you want to extract
    if (levelType === '1') {
      // Level 1 - Shipment Information
      data.shipmentInformation = {
        TD1: hlSegment.TD1,
        TD5: hlSegment.TD5,
      };

      // Iterate over REF segments for additional references
      if (hlSegment.REF) {
        data.shipmentInformation.references = hlSegment.REF.map((ref) => ({
          qualifier: ref[0],
          referenceValue: ref[1],
        }));
      }

      // Iterate over N1 segments for addresses
      if (hlSegment.N1) {
        data.shipmentInformation.addresses = hlSegment.N1.map((n1) => ({
          entityIdentifierCode: n1[0],
          name: n1[1],
          identificationCodeQualifier: n1[2],
          identificationCode: n1[3],
          address: {
            addressLine1: n1[4],
            addressLine2: n1[5],
            city: n1[6],
            state: n1[7],
            postalCode: n1[8],
            country: n1[9],
          },
        }));
      }

      // Iterate over YNQ segments for additional questions/answers
      if (hlSegment.YNQ) {
        data.shipmentInformation.questionsAndAnswers = hlSegment.YNQ.map((ynq) => ({
          questionCode: ynq[0],
          responseCode: ynq[1],
          freeformMessage: ynq[2],
        }));
      }
    }
    hlSegment.HL.forEach(segment => {
      console.log('segment', typeof segment)
      if (typeof segment === 'object') {
        let segment_to_arr = [];
        if (segment.length) {
          // Segment is an array
          segment_to_arr = segment;
        } else {
          segment_to_arr.push(segment)
        }
        segment_to_arr.forEach(hl_item => {
          hl_item.HL.forEach(hl_child => {
            if (typeof hl_child === 'object') {
              console.log('hl_child CONTENT', hl_child);
              if (hl_child.HL) {
                hl_child.HL.forEach(hl_subchild => {
                  if (typeof hl_subchild === 'array' || typeof hl_subchild === 'object') {
                    console.log('hl_subchild CONTENT', hl_subchild);
                    if (hl_subchild.HL) {
                      hl_subchild.HL.forEach(hl_innerchild => {
                        console.log('hl_innerchild CONTENT', hl_innerchild);

                      })
                    }
                  }
                })
              }

            }
          })

        });
        // Level 2 - Item Information
        data.itemInformation = {
          LIN: hlSegment.LIN,
          SN1: hlSegment.SN1,
          SLN: hlSegment.SLN,
          PID: hlSegment.PID,
          REF: hlSegment.REF,
          DTM: hlSegment.DTM,
        };
        console.log('data.itemInformation', data.itemInformation);
        // Extract item-specific information from LIN and PID segments
        if (hlSegment.LIN) {
          data.itemInformation.itemName = hlSegment.LIN[2];
          data.itemInformation.itemID = hlSegment.LIN[3];
        }

        if (hlSegment.PID) {
          // Iterate over PID segments to extract item details
          data.itemInformation.itemDetails = hlSegment.PID.map((pid) => ({
            itemDescription: pid[1],
            dosage: pid[2],
            // Add more fields as needed
          }));
        }
      }
    });


    // Add the extracted data to the result array
    extractedData.push(data);
  });

  return extractedData;
}

// Read the X12 file
const fileName = 'X12_BP2932235763.X12'; // Replace with the path to your X12 file
fs.readFile(fileName, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }

  const jsonData = convertX12ToJSON(data);

  console.log(JSON.stringify(jsonData, null, 2));
});
