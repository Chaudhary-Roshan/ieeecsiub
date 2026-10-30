// ====================================================================
// IEEE DigitalFest 2026 – Projects Expo: Official Team & Participant Data
// Department of Information & Communication Engineering, IUB
// ====================================================================

export interface ExpoTeam {
  sr: number;
  teamName: string;
  memberCount: number;
  leader: string;
  semester: string;
  members: string[];
  projectTitle: string;
}

export interface ExpoParticipant {
  id: string;
  name: string;
  isLeader: boolean;
  teamName: string;
  projectTitle: string;
  semester: string;
  sr: number;
  certificateCode: string;
}

export const DIGITALFEST_TEAMS: ExpoTeam[] = [
  {
    "sr": 1,
    "teamName": "ByteForge",
    "memberCount": 2,
    "leader": "Asadullah Yousaf",
    "semester": "3rd",
    "members": [
      "Asadullah Yousaf",
      "Ali Zaib"
    ],
    "projectTitle": "Synapse Vault"
  },
  {
    "sr": 2,
    "teamName": "Meta Hunters",
    "memberCount": 2,
    "leader": "Muhammad Haseeb",
    "semester": "4th",
    "members": [
      "Muhammad Haseeb",
      "Abdullah"
    ],
    "projectTitle": "Android Artifact Analysis and Timeline Reconstruction"
  },
  {
    "sr": 3,
    "teamName": "The Ironclad",
    "memberCount": 2,
    "leader": "M. Abdul Baqi Syed",
    "semester": "4th",
    "members": [
      "M. Abdul Baqi Syed",
      "Fahad Ikram"
    ],
    "projectTitle": "The DeadMan's Vault"
  },
  {
    "sr": 4,
    "teamName": "Axis Automation",
    "memberCount": 2,
    "leader": "Muhammad Imran",
    "semester": "4th",
    "members": [
      "Muhammad Imran",
      "Hamza Waheed"
    ],
    "projectTitle": "IoT Based Paralyzed Patient Rescue Healthcare System"
  },
  {
    "sr": 5,
    "teamName": "Forensight",
    "memberCount": 2,
    "leader": "Adeel Ahmad",
    "semester": "4th",
    "members": [
      "Adeel Ahmad",
      "Sohail Ahmad"
    ],
    "projectTitle": "Forensight"
  },
  {
    "sr": 6,
    "teamName": "Team Ri",
    "memberCount": 2,
    "leader": "Syed Irtaza Haider",
    "semester": "4th",
    "members": [
      "Syed Irtaza Haider",
      "Nimza Saleem"
    ],
    "projectTitle": "Human Following Car"
  },
  {
    "sr": 7,
    "teamName": "Team Alpha",
    "memberCount": 2,
    "leader": "Ali Hassan Ashraf",
    "semester": "4th",
    "members": [
      "Ali Hassan Ashraf",
      "Ayesha Ikram"
    ],
    "projectTitle": "Quadcopter"
  },
  {
    "sr": 8,
    "teamName": "Daredevil",
    "memberCount": 2,
    "leader": "Rehan Haider",
    "semester": "4th",
    "members": [
      "Rehan Haider",
      "Zeeshan Haider"
    ],
    "projectTitle": "Bluetooth Control Autonomous Car"
  },
  {
    "sr": 9,
    "teamName": "EMG Titans",
    "memberCount": 2,
    "leader": "Muhammad Haseeb Rai",
    "semester": "4th",
    "members": [
      "Muhammad Haseeb Rai",
      "Hussain Haider Naqvi"
    ],
    "projectTitle": "EMG Muscle Control Robotic Vehicle with Obstacle Detection and Voice Alerts"
  },
  {
    "sr": 10,
    "teamName": "Engineers",
    "memberCount": 2,
    "leader": "Ahmad Hassan",
    "semester": "4th",
    "members": [
      "Ahmad Hassan",
      "Awais Ali Rizvi"
    ],
    "projectTitle": "Line Following Robot"
  },
  {
    "sr": 11,
    "teamName": "EventX Forensics",
    "memberCount": 2,
    "leader": "Alishba Qadeer",
    "semester": "4th",
    "members": [
      "Alishba Qadeer",
      "Wajeeha Arooj"
    ],
    "projectTitle": "Windows Event Log Forensics Investigation Tool"
  },
  {
    "sr": 12,
    "teamName": "Team AquaSecure",
    "memberCount": 4,
    "leader": "Ammara Yasmeen",
    "semester": "6th",
    "members": [
      "Ammara Yasmeen",
      "Aliza Kashif",
      "Rahmeen Tahir",
      "Mahnoor Fatima"
    ],
    "projectTitle": "Water Treatment Plant SCADA Simulation"
  },
  {
    "sr": 13,
    "teamName": "Cyberforce",
    "memberCount": 4,
    "leader": "Muhammad Luqman",
    "semester": "6th",
    "members": [
      "Muhammad Luqman",
      "Fiaz Ahmed",
      "Haroon Amjad",
      "Sarmad"
    ],
    "projectTitle": "Replay Attack on IR Based Smart Home Devices"
  },
  {
    "sr": 14,
    "teamName": "The Drone Protectors",
    "memberCount": 4,
    "leader": "Shayan Kazmi",
    "semester": "6th",
    "members": [
      "Shayan Kazmi",
      "Talha Haneef",
      "Muhammad Saif",
      "Adil Zulqarnain"
    ],
    "projectTitle": "Drone Signal Jamming Attack & Frequency Hopping Defense"
  },
  {
    "sr": 15,
    "teamName": "Spoof Hunter",
    "memberCount": 4,
    "leader": "Ambreena Munir",
    "semester": "6th",
    "members": [
      "Ambreena Munir",
      "Sidra Ghaffar",
      "Farah Fatima",
      "Aqsa Ghaffar"
    ],
    "projectTitle": "GPS Spoofing Detection Using Multi-Sensor Fusion"
  },
  {
    "sr": 16,
    "teamName": "Cyberthrives",
    "memberCount": 4,
    "leader": "Muhammad Tayyab",
    "semester": "6th",
    "members": [
      "Muhammad Tayyab",
      "Muhammad Zameer Malik",
      "Abi Saloom Bhatti",
      "Ahmad Ejaz"
    ],
    "projectTitle": "CAN Bus Intrusion Detection System Using Machine Learning"
  },
  {
    "sr": 17,
    "teamName": "Tech Oracle",
    "memberCount": 3,
    "leader": "Ali Shahid",
    "semester": "6th",
    "members": [
      "Ali Shahid",
      "Gul Sher",
      "Muhammad Waleed"
    ],
    "projectTitle": "ARP Spoofing Detection and Prevention"
  },
  {
    "sr": 18,
    "teamName": "Tap2Hack",
    "memberCount": 3,
    "leader": "Muhammad Rehan Nazir",
    "semester": "6th",
    "members": [
      "Muhammad Rehan Nazir",
      "M. Bilal Hussain",
      "Ameer Umer"
    ],
    "projectTitle": "RFID Cloning & Access Control Bypass Simulation"
  },
  {
    "sr": 19,
    "teamName": "NullByte",
    "memberCount": 4,
    "leader": "Muhammad Ahmad Ejaz",
    "semester": "6th",
    "members": [
      "Muhammad Ahmad Ejaz",
      "Abdul Basit",
      "Abdul Majid",
      "Muneeb Ul Rehman"
    ],
    "projectTitle": "OpenPLC Ladder Logic Injection Simulation"
  },
  {
    "sr": 20,
    "teamName": "Exploit Unit",
    "memberCount": 4,
    "leader": "Muhammad Ahmad",
    "semester": "6th",
    "members": [
      "Muhammad Ahmad",
      "Sher Ali",
      "Muhammad Saad Ali",
      "Muhammad Hassan Javed"
    ],
    "projectTitle": "Secure Long Range Communication System"
  },
  {
    "sr": 21,
    "teamName": "SkyShield",
    "memberCount": 4,
    "leader": "Abdul Hanan",
    "semester": "6th",
    "members": [
      "Abdul Hanan",
      "Muhammad Kaif",
      "Muhammad Umer Rizwan",
      "Muhammad Aqib Javed"
    ],
    "projectTitle": "Drone Geofencing with Kill Switch Mechanism"
  },
  {
    "sr": 22,
    "teamName": "Pixel Pirates",
    "memberCount": 2,
    "leader": "Syeda Eeman Fatima",
    "semester": "6th",
    "members": [
      "Syeda Eeman Fatima",
      "Sundas Fatima Shafique"
    ],
    "projectTitle": "WiFi Deauthentication & Auto Channel Hopping"
  },
  {
    "sr": 23,
    "teamName": "The Boys",
    "memberCount": 4,
    "leader": "Muhammad Mustaqeem",
    "semester": "6th",
    "members": [
      "Muhammad Mustaqeem",
      "Muhammad Annas Manzoor",
      "Muhammad Dawood Sajid",
      "Muhammad Usman Kashif"
    ],
    "projectTitle": "Replay Attack on IR Based Smart Home Devices"
  },
  {
    "sr": 24,
    "teamName": "Team Insane",
    "memberCount": 3,
    "leader": "Muhammad Mahad Asif",
    "semester": "6th",
    "members": [
      "Muhammad Mahad Asif",
      "Zain Ali",
      "Aryan Javed"
    ],
    "projectTitle": "Side-Channel Attack: Timing Analysis on Embedded Authentication"
  },
  {
    "sr": 25,
    "teamName": "IoT Experts",
    "memberCount": 4,
    "leader": "Hashir Imran",
    "semester": "6th",
    "members": [
      "Hashir Imran",
      "Abdullah Ashraf",
      "Hussain Joiya",
      "Ali Hassan Joiya"
    ],
    "projectTitle": "Smart Home"
  },
  {
    "sr": 26,
    "teamName": "SNOPZ",
    "memberCount": 4,
    "leader": "Muhammad Haider Tallal",
    "semester": "6th",
    "members": [
      "Muhammad Haider Tallal",
      "Muhammad Shoaib",
      "Muhammad Safiullah",
      "Luqman Khan"
    ],
    "projectTitle": "WiFi-Watch-Dog: WiFi Attacks Using ESP32"
  },
  {
    "sr": 27,
    "teamName": "Cyber Nova",
    "memberCount": 4,
    "leader": "Zaheer Abbas",
    "semester": "6th",
    "members": [
      "Zaheer Abbas",
      "Karamat Ali",
      "Shaheer Ahmed",
      "Saifullah"
    ],
    "projectTitle": "Advanced ARP Spoofing Detection & Prevention System"
  },
  {
    "sr": 28,
    "teamName": "The Defenders",
    "memberCount": 4,
    "leader": "Muhammad Asad ur Rehman",
    "semester": "6th",
    "members": [
      "Muhammad Asad ur Rehman",
      "Sharjeel Ibtisham",
      "Qazi Ayaan",
      "M. Uzair"
    ],
    "projectTitle": "Smart Grid SCADA Honeypot with Real-Time Alerting"
  },
  {
    "sr": 29,
    "teamName": "ICS DEFENDERS",
    "memberCount": 2,
    "leader": "Mahnoor Shafi",
    "semester": "6th",
    "members": [
      "Mahnoor Shafi",
      "Aqsa Batool"
    ],
    "projectTitle": "Modbus TCP/IP Firewall for Industrial Control Systems"
  },
  {
    "sr": 30,
    "teamName": "Aegisora",
    "memberCount": 3,
    "leader": "Ahmad Javed",
    "semester": "7th",
    "members": [
      "Ahmad Javed",
      "Asma Razaq",
      "Samina Parveen"
    ],
    "projectTitle": "Pentest Pro"
  },
  {
    "sr": 31,
    "teamName": "Sikandar Hayat Team",
    "memberCount": 2,
    "leader": "Sikandar Hayat",
    "semester": "7th",
    "members": [
      "Sikandar Hayat",
      "Abdul Moiz"
    ],
    "projectTitle": "Zero-Trust Healthcare Portal"
  },
  {
    "sr": 32,
    "teamName": "CyberShield",
    "memberCount": 3,
    "leader": "Nida Fatima",
    "semester": "7th",
    "members": [
      "Nida Fatima",
      "Rubina Khadim",
      "Zahra Bibi"
    ],
    "projectTitle": "AI-Based Secure Smart City Monitoring System"
  },
  {
    "sr": 33,
    "teamName": "Threat Detector",
    "memberCount": 3,
    "leader": "Shan Rasool",
    "semester": "7th",
    "members": [
      "Shan Rasool",
      "Faizan Manazir",
      "Ahmed Ghaffari"
    ],
    "projectTitle": "AI-Based Insider Threat Detection System"
  },
  {
    "sr": 34,
    "teamName": "M Amjad Team",
    "memberCount": 3,
    "leader": "M Amjad",
    "semester": "7th",
    "members": [
      "M Amjad",
      "Aziz ur Rehman",
      "Ali Hamza"
    ],
    "projectTitle": "Web Vulnerability Scanner"
  },
  {
    "sr": 35,
    "teamName": "Muhammad Zulqarnain Team",
    "memberCount": 3,
    "leader": "Muhammad Zulqarnain",
    "semester": "7th",
    "members": [
      "Muhammad Zulqarnain",
      "Muzafar Khan",
      "Ali Hassan"
    ],
    "projectTitle": "Secure Feedback Management System"
  },
  {
    "sr": 36,
    "teamName": "ZeroThreat",
    "memberCount": 3,
    "leader": "Talha Faizan",
    "semester": "7th",
    "members": [
      "Talha Faizan",
      "Umair Ashraf",
      "Ahmad Hassan"
    ],
    "projectTitle": "Secure E-Commerce Platform with AI-Driven Feedback Moderation"
  },
  {
    "sr": 37,
    "teamName": "Cipher_Vote",
    "memberCount": 2,
    "leader": "Muhammad Hamid",
    "semester": "7th",
    "members": [
      "Muhammad Hamid",
      "Anfal Tariq"
    ],
    "projectTitle": "Adaptive Secure Online Voting System"
  },
  {
    "sr": 38,
    "teamName": "Cloud Intrusion Detection",
    "memberCount": 2,
    "leader": "Saina Rizvi",
    "semester": "8th",
    "members": [
      "Saina Rizvi",
      "Musfira Hashmi"
    ],
    "projectTitle": "AI Powered Cloud Intrusion Detection System"
  },
  {
    "sr": 39,
    "teamName": "Group No. 15",
    "memberCount": 2,
    "leader": "Muhammad Mehmood ul Hassan",
    "semester": "8th",
    "members": [
      "Muhammad Mehmood ul Hassan",
      "Arham Ikhlaq"
    ],
    "projectTitle": "Secure Tunnel: Private Cloud-Based VPN & Firewall"
  },
  {
    "sr": 40,
    "teamName": "CloudGuard Security Provider",
    "memberCount": 2,
    "leader": "Mahnoor Fatima",
    "semester": "8th",
    "members": [
      "Mahnoor Fatima",
      "M. Basit"
    ],
    "projectTitle": "Never-Trust Verification Framework"
  },
  {
    "sr": 41,
    "teamName": "Security Implementers",
    "memberCount": 3,
    "leader": "M Ahmad Khan",
    "semester": "8th",
    "members": [
      "M Ahmad Khan",
      "Muhammad Adil",
      "Sohaib Ahmad"
    ],
    "projectTitle": "Encrypted Docs with RBAC"
  },
  {
    "sr": 42,
    "teamName": "Cloud Defenders",
    "memberCount": 2,
    "leader": "Mujeeb ur Rehman",
    "semester": "8th",
    "members": [
      "Mujeeb ur Rehman",
      "Misbah Kanwal"
    ],
    "projectTitle": "CloudShield Pro"
  },
  {
    "sr": 43,
    "teamName": "Aroob Mukhtar Team",
    "memberCount": 2,
    "leader": "Aroob Mukhtar",
    "semester": "8th",
    "members": [
      "Aroob Mukhtar",
      "M. Madni"
    ],
    "projectTitle": "AI Enhanced One-Time Secure Cloud Data Protection"
  },
  {
    "sr": 44,
    "teamName": "Faheem Abbas Team",
    "memberCount": 2,
    "leader": "Faheem Abbas",
    "semester": "8th",
    "members": [
      "Faheem Abbas",
      "Zain ul Abdeen"
    ],
    "projectTitle": "SecureVault"
  },
  {
    "sr": 45,
    "teamName": "Hunter Guardian",
    "memberCount": 2,
    "leader": "Hafiz Aurangzaib",
    "semester": "8th",
    "members": [
      "Hafiz Aurangzaib",
      "Syed Zia ur Rehman"
    ],
    "projectTitle": "SecureCloud Guardian"
  },
  {
    "sr": 46,
    "teamName": "Secure File Sharing System",
    "memberCount": 2,
    "leader": "Asad Abbas",
    "semester": "8th",
    "members": [
      "Asad Abbas",
      "Murtajiz Ali Khan"
    ],
    "projectTitle": "Secure File Sharing with Encryption"
  },
  {
    "sr": 47,
    "teamName": "Cyber Duo",
    "memberCount": 2,
    "leader": "Muhammad Taha",
    "semester": "8th",
    "members": [
      "Muhammad Taha",
      "Hafiz Abdullah Sajid"
    ],
    "projectTitle": "Cloud Log Anomaly Detector"
  },
  {
    "sr": 48,
    "teamName": "Muhammad Tufail Team",
    "memberCount": 2,
    "leader": "Muhammad Tufail",
    "semester": "8th",
    "members": [
      "Muhammad Tufail",
      "Shazia Jamil"
    ],
    "projectTitle": "AI Powered Detection Tool"
  },
  {
    "sr": 49,
    "teamName": "Azure Forensic Investigator Team",
    "memberCount": 2,
    "leader": "Muhammad Qasim",
    "semester": "8th",
    "members": [
      "Muhammad Qasim",
      "Umar Draz"
    ],
    "projectTitle": "CloudForensics Platform"
  },
  {
    "sr": 50,
    "teamName": "Cyber Rex",
    "memberCount": 2,
    "leader": "Muhammad Hamza Hayat",
    "semester": "8th",
    "members": [
      "Muhammad Hamza Hayat",
      "Asad Liaqat"
    ],
    "projectTitle": "Automated Cloud Threat Detonation & SIEM Detection"
  },
  {
    "sr": 51,
    "teamName": "VaultSync",
    "memberCount": 2,
    "leader": "Asma Mukhtiar",
    "semester": "8th",
    "members": [
      "Asma Mukhtiar",
      "Kishwar Ishfaq"
    ],
    "projectTitle": "Cloud-Based Password Manager"
  },
  {
    "sr": 52,
    "teamName": "Team Wazir",
    "memberCount": 2,
    "leader": "Atta Ullah",
    "semester": "8th",
    "members": [
      "Atta Ullah",
      "Ahmad Hassan"
    ],
    "projectTitle": "Fishtrace"
  },
  {
    "sr": 53,
    "teamName": "CloudPhantom",
    "memberCount": 2,
    "leader": "Muhammad Mubeen Nawaz",
    "semester": "8th",
    "members": [
      "Muhammad Mubeen Nawaz",
      "Ayesha Amjad Ali"
    ],
    "projectTitle": "CloudPentest Framework"
  },
  {
    "sr": 54,
    "teamName": "SecurePulse",
    "memberCount": 2,
    "leader": "Muhammad Zaid",
    "semester": "8th",
    "members": [
      "Muhammad Zaid",
      "Bushra Noreen"
    ],
    "projectTitle": "Cloud File Integrity Monitoring"
  },
  {
    "sr": 56,
    "teamName": "Alpha",
    "memberCount": 2,
    "leader": "Rabeeza Mehmood Ali",
    "semester": "8th",
    "members": [
      "Rabeeza Mehmood Ali",
      "Isha Fatima"
    ],
    "projectTitle": "SENTINEL: ML-Powered Cloud Security Operations Platform"
  },
  {
    "sr": 57,
    "teamName": "Alpha",
    "memberCount": 2,
    "leader": "Afifa Yasin",
    "semester": "8th",
    "members": [
      "Afifa Yasin",
      "Muhammad Zohaib"
    ],
    "projectTitle": "AI-Powered Multi-Cloud Misconfiguration Detection Platform"
  },
  {
    "sr": 58,
    "teamName": "Cybrion Security",
    "memberCount": 2,
    "leader": "Muhammad Luqman Rasheed",
    "semester": "8th",
    "members": [
      "Muhammad Luqman Rasheed",
      "Kainat Akbar"
    ],
    "projectTitle": "API Abuse Detection Tool"
  },
  {
    "sr": 59,
    "teamName": "Cloud Defender",
    "memberCount": 2,
    "leader": "Yashal Farooqi",
    "semester": "8th",
    "members": [
      "Yashal Farooqi",
      "Laiba Shoaib"
    ],
    "projectTitle": "Sentrix"
  },
  {
    "sr": 60,
    "teamName": "Alpha",
    "memberCount": 2,
    "leader": "Momina Rehman",
    "semester": "8th",
    "members": [
      "Momina Rehman",
      "Sana Younis"
    ],
    "projectTitle": "Deep Learning Driven Dark Web Threat Intelligence Platform"
  },
  {
    "sr": 61,
    "teamName": "Amika",
    "memberCount": 2,
    "leader": "Atika Athar",
    "semester": "8th",
    "members": [
      "Atika Athar",
      "Amina Naseem"
    ],
    "projectTitle": "HoneypotX: AI-Powered Cloud Honeypot for Cyber Threat Detection"
  }
];

export const DIGITALFEST_PARTICIPANTS: ExpoParticipant[] = [
  {
    "id": "reg-df-001",
    "name": "Asadullah Yousaf",
    "isLeader": true,
    "teamName": "ByteForge",
    "projectTitle": "Synapse Vault",
    "semester": "3rd",
    "sr": 1,
    "certificateCode": "CSIUB-26-DF01-T2XK"
  },
  {
    "id": "reg-df-002",
    "name": "Ali Zaib",
    "isLeader": false,
    "teamName": "ByteForge",
    "projectTitle": "Synapse Vault",
    "semester": "3rd",
    "sr": 1,
    "certificateCode": "CSIUB-26-DF02-AHFF"
  },
  {
    "id": "reg-df-003",
    "name": "Muhammad Haseeb",
    "isLeader": true,
    "teamName": "Meta Hunters",
    "projectTitle": "Android Artifact Analysis and Timeline Reconstruction",
    "semester": "4th",
    "sr": 2,
    "certificateCode": "CSIUB-26-DF03-RYXA"
  },
  {
    "id": "reg-df-004",
    "name": "Abdullah",
    "isLeader": false,
    "teamName": "Meta Hunters",
    "projectTitle": "Android Artifact Analysis and Timeline Reconstruction",
    "semester": "4th",
    "sr": 2,
    "certificateCode": "CSIUB-26-DF04-8FE6"
  },
  {
    "id": "reg-df-005",
    "name": "M. Abdul Baqi Syed",
    "isLeader": true,
    "teamName": "The Ironclad",
    "projectTitle": "The DeadMan's Vault",
    "semester": "4th",
    "sr": 3,
    "certificateCode": "CSIUB-26-DF05-PWW2"
  },
  {
    "id": "reg-df-006",
    "name": "Fahad Ikram",
    "isLeader": false,
    "teamName": "The Ironclad",
    "projectTitle": "The DeadMan's Vault",
    "semester": "4th",
    "sr": 3,
    "certificateCode": "CSIUB-26-DF06-6DEW"
  },
  {
    "id": "reg-df-007",
    "name": "Muhammad Imran",
    "isLeader": true,
    "teamName": "Axis Automation",
    "projectTitle": "IoT Based Paralyzed Patient Rescue Healthcare System",
    "semester": "4th",
    "sr": 4,
    "certificateCode": "CSIUB-26-DF07-MUVR"
  },
  {
    "id": "reg-df-008",
    "name": "Hamza Waheed",
    "isLeader": false,
    "teamName": "Axis Automation",
    "projectTitle": "IoT Based Paralyzed Patient Rescue Healthcare System",
    "semester": "4th",
    "sr": 4,
    "certificateCode": "CSIUB-26-DF08-4BDM"
  },
  {
    "id": "reg-df-009",
    "name": "Adeel Ahmad",
    "isLeader": true,
    "teamName": "Forensight",
    "projectTitle": "Forensight",
    "semester": "4th",
    "sr": 5,
    "certificateCode": "CSIUB-26-DF09-KSVH"
  },
  {
    "id": "reg-df-010",
    "name": "Sohail Ahmad",
    "isLeader": false,
    "teamName": "Forensight",
    "projectTitle": "Forensight",
    "semester": "4th",
    "sr": 5,
    "certificateCode": "CSIUB-26-DF10-29CD"
  },
  {
    "id": "reg-df-011",
    "name": "Syed Irtaza Haider",
    "isLeader": true,
    "teamName": "Team Ri",
    "projectTitle": "Human Following Car",
    "semester": "4th",
    "sr": 6,
    "certificateCode": "CSIUB-26-DF11-HQU8"
  },
  {
    "id": "reg-df-012",
    "name": "Nimza Saleem",
    "isLeader": false,
    "teamName": "Team Ri",
    "projectTitle": "Human Following Car",
    "semester": "4th",
    "sr": 6,
    "certificateCode": "CSIUB-26-DF12-Y7C4"
  },
  {
    "id": "reg-df-013",
    "name": "Ali Hassan Ashraf",
    "isLeader": true,
    "teamName": "Team Alpha",
    "projectTitle": "Quadcopter",
    "semester": "4th",
    "sr": 7,
    "certificateCode": "CSIUB-26-DF13-FNTY"
  },
  {
    "id": "reg-df-014",
    "name": "Ayesha Ikram",
    "isLeader": false,
    "teamName": "Team Alpha",
    "projectTitle": "Quadcopter",
    "semester": "4th",
    "sr": 7,
    "certificateCode": "CSIUB-26-DF14-W5BU"
  },
  {
    "id": "reg-df-015",
    "name": "Rehan Haider",
    "isLeader": true,
    "teamName": "Daredevil",
    "projectTitle": "Bluetooth Control Autonomous Car",
    "semester": "4th",
    "sr": 8,
    "certificateCode": "CSIUB-26-DF15-DLTP"
  },
  {
    "id": "reg-df-016",
    "name": "Zeeshan Haider",
    "isLeader": false,
    "teamName": "Daredevil",
    "projectTitle": "Bluetooth Control Autonomous Car",
    "semester": "4th",
    "sr": 8,
    "certificateCode": "CSIUB-26-DF16-U3AK"
  },
  {
    "id": "reg-df-017",
    "name": "Muhammad Haseeb Rai",
    "isLeader": true,
    "teamName": "EMG Titans",
    "projectTitle": "EMG Muscle Control Robotic Vehicle with Obstacle Detection and Voice Alerts",
    "semester": "4th",
    "sr": 9,
    "certificateCode": "CSIUB-26-DF17-BJSF"
  },
  {
    "id": "reg-df-018",
    "name": "Hussain Haider Naqvi",
    "isLeader": false,
    "teamName": "EMG Titans",
    "projectTitle": "EMG Muscle Control Robotic Vehicle with Obstacle Detection and Voice Alerts",
    "semester": "4th",
    "sr": 9,
    "certificateCode": "CSIUB-26-DF18-SZAB"
  },
  {
    "id": "reg-df-019",
    "name": "Ahmad Hassan",
    "isLeader": true,
    "teamName": "Engineers",
    "projectTitle": "Line Following Robot",
    "semester": "4th",
    "sr": 10,
    "certificateCode": "CSIUB-26-DF19-9GR6"
  },
  {
    "id": "reg-df-020",
    "name": "Awais Ali Rizvi",
    "isLeader": false,
    "teamName": "Engineers",
    "projectTitle": "Line Following Robot",
    "semester": "4th",
    "sr": 10,
    "certificateCode": "CSIUB-26-DF20-QX92"
  },
  {
    "id": "reg-df-021",
    "name": "Alishba Qadeer",
    "isLeader": true,
    "teamName": "EventX Forensics",
    "projectTitle": "Windows Event Log Forensics Investigation Tool",
    "semester": "4th",
    "sr": 11,
    "certificateCode": "CSIUB-26-DF21-7ERW"
  },
  {
    "id": "reg-df-022",
    "name": "Wajeeha Arooj",
    "isLeader": false,
    "teamName": "EventX Forensics",
    "projectTitle": "Windows Event Log Forensics Investigation Tool",
    "semester": "4th",
    "sr": 11,
    "certificateCode": "CSIUB-26-DF22-NV8S"
  },
  {
    "id": "reg-df-023",
    "name": "Ammara Yasmeen",
    "isLeader": true,
    "teamName": "Team AquaSecure",
    "projectTitle": "Water Treatment Plant SCADA Simulation",
    "semester": "6th",
    "sr": 12,
    "certificateCode": "CSIUB-26-DF23-5CQM"
  },
  {
    "id": "reg-df-024",
    "name": "Aliza Kashif",
    "isLeader": false,
    "teamName": "Team AquaSecure",
    "projectTitle": "Water Treatment Plant SCADA Simulation",
    "semester": "6th",
    "sr": 12,
    "certificateCode": "CSIUB-26-DF24-LT8H"
  },
  {
    "id": "reg-df-025",
    "name": "Rahmeen Tahir",
    "isLeader": false,
    "teamName": "Team AquaSecure",
    "projectTitle": "Water Treatment Plant SCADA Simulation",
    "semester": "6th",
    "sr": 12,
    "certificateCode": "CSIUB-26-DF25-3APD"
  },
  {
    "id": "reg-df-026",
    "name": "Mahnoor Fatima",
    "isLeader": false,
    "teamName": "Team AquaSecure",
    "projectTitle": "Water Treatment Plant SCADA Simulation",
    "semester": "6th",
    "sr": 12,
    "certificateCode": "CSIUB-26-DF26-JR79"
  },
  {
    "id": "reg-df-027",
    "name": "Muhammad Luqman",
    "isLeader": true,
    "teamName": "Cyberforce",
    "projectTitle": "Replay Attack on IR Based Smart Home Devices",
    "semester": "6th",
    "sr": 13,
    "certificateCode": "CSIUB-26-DF27-Z8P4"
  },
  {
    "id": "reg-df-028",
    "name": "Fiaz Ahmed",
    "isLeader": false,
    "teamName": "Cyberforce",
    "projectTitle": "Replay Attack on IR Based Smart Home Devices",
    "semester": "6th",
    "sr": 13,
    "certificateCode": "CSIUB-26-DF28-GP6Y"
  },
  {
    "id": "reg-df-029",
    "name": "Haroon Amjad",
    "isLeader": false,
    "teamName": "Cyberforce",
    "projectTitle": "Replay Attack on IR Based Smart Home Devices",
    "semester": "6th",
    "sr": 13,
    "certificateCode": "CSIUB-26-DF29-X6NU"
  },
  {
    "id": "reg-df-030",
    "name": "Sarmad",
    "isLeader": false,
    "teamName": "Cyberforce",
    "projectTitle": "Replay Attack on IR Based Smart Home Devices",
    "semester": "6th",
    "sr": 13,
    "certificateCode": "CSIUB-26-DF30-EM6Q"
  },
  {
    "id": "reg-df-031",
    "name": "Shayan Kazmi",
    "isLeader": true,
    "teamName": "The Drone Protectors",
    "projectTitle": "Drone Signal Jamming Attack & Frequency Hopping Defense",
    "semester": "6th",
    "sr": 14,
    "certificateCode": "CSIUB-26-DF31-V4MK"
  },
  {
    "id": "reg-df-032",
    "name": "Talha Haneef",
    "isLeader": false,
    "teamName": "The Drone Protectors",
    "projectTitle": "Drone Signal Jamming Attack & Frequency Hopping Defense",
    "semester": "6th",
    "sr": 14,
    "certificateCode": "CSIUB-26-DF32-CK5F"
  },
  {
    "id": "reg-df-033",
    "name": "Muhammad Saif",
    "isLeader": false,
    "teamName": "The Drone Protectors",
    "projectTitle": "Drone Signal Jamming Attack & Frequency Hopping Defense",
    "semester": "6th",
    "sr": 14,
    "certificateCode": "CSIUB-26-DF33-T2MB"
  },
  {
    "id": "reg-df-034",
    "name": "Adil Zulqarnain",
    "isLeader": false,
    "teamName": "The Drone Protectors",
    "projectTitle": "Drone Signal Jamming Attack & Frequency Hopping Defense",
    "semester": "6th",
    "sr": 14,
    "certificateCode": "CSIUB-26-DF34-AH47"
  },
  {
    "id": "reg-df-035",
    "name": "Ambreena Munir",
    "isLeader": true,
    "teamName": "Spoof Hunter",
    "projectTitle": "GPS Spoofing Detection Using Multi-Sensor Fusion",
    "semester": "6th",
    "sr": 15,
    "certificateCode": "CSIUB-26-DF35-RYL2"
  },
  {
    "id": "reg-df-036",
    "name": "Sidra Ghaffar",
    "isLeader": false,
    "teamName": "Spoof Hunter",
    "projectTitle": "GPS Spoofing Detection Using Multi-Sensor Fusion",
    "semester": "6th",
    "sr": 15,
    "certificateCode": "CSIUB-26-DF36-8F4W"
  },
  {
    "id": "reg-df-037",
    "name": "Farah Fatima",
    "isLeader": false,
    "teamName": "Spoof Hunter",
    "projectTitle": "GPS Spoofing Detection Using Multi-Sensor Fusion",
    "semester": "6th",
    "sr": 15,
    "certificateCode": "CSIUB-26-DF37-PWKS"
  },
  {
    "id": "reg-df-038",
    "name": "Aqsa Ghaffar",
    "isLeader": false,
    "teamName": "Spoof Hunter",
    "projectTitle": "GPS Spoofing Detection Using Multi-Sensor Fusion",
    "semester": "6th",
    "sr": 15,
    "certificateCode": "CSIUB-26-DF38-6D3N"
  },
  {
    "id": "reg-df-039",
    "name": "Muhammad Tayyab",
    "isLeader": true,
    "teamName": "Cyberthrives",
    "projectTitle": "CAN Bus Intrusion Detection System Using Machine Learning",
    "semester": "6th",
    "sr": 16,
    "certificateCode": "CSIUB-26-DF39-MUKH"
  },
  {
    "id": "reg-df-040",
    "name": "Muhammad Zameer Malik",
    "isLeader": false,
    "teamName": "Cyberthrives",
    "projectTitle": "CAN Bus Intrusion Detection System Using Machine Learning",
    "semester": "6th",
    "sr": 16,
    "certificateCode": "CSIUB-26-DF40-4B2D"
  },
  {
    "id": "reg-df-041",
    "name": "Abi Saloom Bhatti",
    "isLeader": false,
    "teamName": "Cyberthrives",
    "projectTitle": "CAN Bus Intrusion Detection System Using Machine Learning",
    "semester": "6th",
    "sr": 16,
    "certificateCode": "CSIUB-26-DF41-KSJ9"
  },
  {
    "id": "reg-df-042",
    "name": "Ahmad Ejaz",
    "isLeader": false,
    "teamName": "Cyberthrives",
    "projectTitle": "CAN Bus Intrusion Detection System Using Machine Learning",
    "semester": "6th",
    "sr": 16,
    "certificateCode": "CSIUB-26-DF42-2925"
  },
  {
    "id": "reg-df-043",
    "name": "Ali Shahid",
    "isLeader": true,
    "teamName": "Tech Oracle",
    "projectTitle": "ARP Spoofing Detection and Prevention",
    "semester": "6th",
    "sr": 17,
    "certificateCode": "CSIUB-26-DF43-HQHY"
  },
  {
    "id": "reg-df-044",
    "name": "Gul Sher",
    "isLeader": false,
    "teamName": "Tech Oracle",
    "projectTitle": "ARP Spoofing Detection and Prevention",
    "semester": "6th",
    "sr": 17,
    "certificateCode": "CSIUB-26-DF44-Y7ZU"
  },
  {
    "id": "reg-df-045",
    "name": "Muhammad Waleed",
    "isLeader": false,
    "teamName": "Tech Oracle",
    "projectTitle": "ARP Spoofing Detection and Prevention",
    "semester": "6th",
    "sr": 17,
    "certificateCode": "CSIUB-26-DF45-FNHQ"
  },
  {
    "id": "reg-df-046",
    "name": "Muhammad Rehan Nazir",
    "isLeader": true,
    "teamName": "Tap2Hack",
    "projectTitle": "RFID Cloning & Access Control Bypass Simulation",
    "semester": "6th",
    "sr": 18,
    "certificateCode": "CSIUB-26-DF46-W5YL"
  },
  {
    "id": "reg-df-047",
    "name": "M. Bilal Hussain",
    "isLeader": false,
    "teamName": "Tap2Hack",
    "projectTitle": "RFID Cloning & Access Control Bypass Simulation",
    "semester": "6th",
    "sr": 18,
    "certificateCode": "CSIUB-26-DF47-DLGF"
  },
  {
    "id": "reg-df-048",
    "name": "Ameer Umer",
    "isLeader": false,
    "teamName": "Tap2Hack",
    "projectTitle": "RFID Cloning & Access Control Bypass Simulation",
    "semester": "6th",
    "sr": 18,
    "certificateCode": "CSIUB-26-DF48-U3YB"
  },
  {
    "id": "reg-df-049",
    "name": "Muhammad Ahmad Ejaz",
    "isLeader": true,
    "teamName": "NullByte",
    "projectTitle": "OpenPLC Ladder Logic Injection Simulation",
    "semester": "6th",
    "sr": 19,
    "certificateCode": "CSIUB-26-DF49-BJF7"
  },
  {
    "id": "reg-df-050",
    "name": "Abdul Basit",
    "isLeader": false,
    "teamName": "NullByte",
    "projectTitle": "OpenPLC Ladder Logic Injection Simulation",
    "semester": "6th",
    "sr": 19,
    "certificateCode": "CSIUB-26-DF50-SZX3"
  },
  {
    "id": "reg-df-051",
    "name": "Abdul Majid",
    "isLeader": false,
    "teamName": "NullByte",
    "projectTitle": "OpenPLC Ladder Logic Injection Simulation",
    "semester": "6th",
    "sr": 19,
    "certificateCode": "CSIUB-26-DF51-9GFW"
  },
  {
    "id": "reg-df-052",
    "name": "Muneeb Ul Rehman",
    "isLeader": false,
    "teamName": "NullByte",
    "projectTitle": "OpenPLC Ladder Logic Injection Simulation",
    "semester": "6th",
    "sr": 19,
    "certificateCode": "CSIUB-26-DF52-QXWS"
  },
  {
    "id": "reg-df-053",
    "name": "Muhammad Ahmad",
    "isLeader": true,
    "teamName": "Exploit Unit",
    "projectTitle": "Secure Long Range Communication System",
    "semester": "6th",
    "sr": 20,
    "certificateCode": "CSIUB-26-DF53-7EEN"
  },
  {
    "id": "reg-df-054",
    "name": "Sher Ali",
    "isLeader": false,
    "teamName": "Exploit Unit",
    "projectTitle": "Secure Long Range Communication System",
    "semester": "6th",
    "sr": 20,
    "certificateCode": "CSIUB-26-DF54-NVWJ"
  },
  {
    "id": "reg-df-055",
    "name": "Muhammad Saad Ali",
    "isLeader": false,
    "teamName": "Exploit Unit",
    "projectTitle": "Secure Long Range Communication System",
    "semester": "6th",
    "sr": 20,
    "certificateCode": "CSIUB-26-DF55-5CDD"
  },
  {
    "id": "reg-df-056",
    "name": "Muhammad Hassan Javed",
    "isLeader": false,
    "teamName": "Exploit Unit",
    "projectTitle": "Secure Long Range Communication System",
    "semester": "6th",
    "sr": 20,
    "certificateCode": "CSIUB-26-DF56-LTV9"
  },
  {
    "id": "reg-df-057",
    "name": "Abdul Hanan",
    "isLeader": true,
    "teamName": "SkyShield",
    "projectTitle": "Drone Geofencing with Kill Switch Mechanism",
    "semester": "6th",
    "sr": 21,
    "certificateCode": "CSIUB-26-DF57-3AD5"
  },
  {
    "id": "reg-df-058",
    "name": "Muhammad Kaif",
    "isLeader": false,
    "teamName": "SkyShield",
    "projectTitle": "Drone Geofencing with Kill Switch Mechanism",
    "semester": "6th",
    "sr": 21,
    "certificateCode": "CSIUB-26-DF58-JRUZ"
  },
  {
    "id": "reg-df-059",
    "name": "Muhammad Umer Rizwan",
    "isLeader": false,
    "teamName": "SkyShield",
    "projectTitle": "Drone Geofencing with Kill Switch Mechanism",
    "semester": "6th",
    "sr": 21,
    "certificateCode": "CSIUB-26-DF59-Z8CU"
  },
  {
    "id": "reg-df-060",
    "name": "Muhammad Aqib Javed",
    "isLeader": false,
    "teamName": "SkyShield",
    "projectTitle": "Drone Geofencing with Kill Switch Mechanism",
    "semester": "6th",
    "sr": 21,
    "certificateCode": "CSIUB-26-DF60-GPUQ"
  },
  {
    "id": "reg-df-061",
    "name": "Syeda Eeman Fatima",
    "isLeader": true,
    "teamName": "Pixel Pirates",
    "projectTitle": "WiFi Deauthentication & Auto Channel Hopping",
    "semester": "6th",
    "sr": 22,
    "certificateCode": "CSIUB-26-DF61-X6BL"
  },
  {
    "id": "reg-df-062",
    "name": "Sundas Fatima Shafique",
    "isLeader": false,
    "teamName": "Pixel Pirates",
    "projectTitle": "WiFi Deauthentication & Auto Channel Hopping",
    "semester": "6th",
    "sr": 22,
    "certificateCode": "CSIUB-26-DF62-EMTG"
  },
  {
    "id": "reg-df-063",
    "name": "Muhammad Mustaqeem",
    "isLeader": true,
    "teamName": "The Boys",
    "projectTitle": "Replay Attack on IR Based Smart Home Devices",
    "semester": "6th",
    "sr": 23,
    "certificateCode": "CSIUB-26-DF63-V4BB"
  },
  {
    "id": "reg-df-064",
    "name": "Muhammad Annas Manzoor",
    "isLeader": false,
    "teamName": "The Boys",
    "projectTitle": "Replay Attack on IR Based Smart Home Devices",
    "semester": "6th",
    "sr": 23,
    "certificateCode": "CSIUB-26-DF64-CKS7"
  },
  {
    "id": "reg-df-065",
    "name": "Muhammad Dawood Sajid",
    "isLeader": false,
    "teamName": "The Boys",
    "projectTitle": "Replay Attack on IR Based Smart Home Devices",
    "semester": "6th",
    "sr": 23,
    "certificateCode": "CSIUB-26-DF65-T2A3"
  },
  {
    "id": "reg-df-066",
    "name": "Muhammad Usman Kashif",
    "isLeader": false,
    "teamName": "The Boys",
    "projectTitle": "Replay Attack on IR Based Smart Home Devices",
    "semester": "6th",
    "sr": 23,
    "certificateCode": "CSIUB-26-DF66-AHSX"
  },
  {
    "id": "reg-df-067",
    "name": "Muhammad Mahad Asif",
    "isLeader": true,
    "teamName": "Team Insane",
    "projectTitle": "Side-Channel Attack: Timing Analysis on Embedded Authentication",
    "semester": "6th",
    "sr": 24,
    "certificateCode": "CSIUB-26-DF67-RY9S"
  },
  {
    "id": "reg-df-068",
    "name": "Zain Ali",
    "isLeader": false,
    "teamName": "Team Insane",
    "projectTitle": "Side-Channel Attack: Timing Analysis on Embedded Authentication",
    "semester": "6th",
    "sr": 24,
    "certificateCode": "CSIUB-26-DF68-8FRN"
  },
  {
    "id": "reg-df-069",
    "name": "Aryan Javed",
    "isLeader": false,
    "teamName": "Team Insane",
    "projectTitle": "Side-Channel Attack: Timing Analysis on Embedded Authentication",
    "semester": "6th",
    "sr": 24,
    "certificateCode": "CSIUB-26-DF69-PW9J"
  },
  {
    "id": "reg-df-070",
    "name": "Hashir Imran",
    "isLeader": true,
    "teamName": "IoT Experts",
    "projectTitle": "Smart Home",
    "semester": "6th",
    "sr": 25,
    "certificateCode": "CSIUB-26-DF70-6DQE"
  },
  {
    "id": "reg-df-071",
    "name": "Abdullah Ashraf",
    "isLeader": false,
    "teamName": "IoT Experts",
    "projectTitle": "Smart Home",
    "semester": "6th",
    "sr": 25,
    "certificateCode": "CSIUB-26-DF71-MU89"
  },
  {
    "id": "reg-df-072",
    "name": "Hussain Joiya",
    "isLeader": false,
    "teamName": "IoT Experts",
    "projectTitle": "Smart Home",
    "semester": "6th",
    "sr": 25,
    "certificateCode": "CSIUB-26-DF72-4BQ5"
  },
  {
    "id": "reg-df-073",
    "name": "Ali Hassan Joiya",
    "isLeader": false,
    "teamName": "IoT Experts",
    "projectTitle": "Smart Home",
    "semester": "6th",
    "sr": 25,
    "certificateCode": "CSIUB-26-DF73-KS7Z"
  },
  {
    "id": "reg-df-074",
    "name": "Muhammad Haider Tallal",
    "isLeader": true,
    "teamName": "SNOPZ",
    "projectTitle": "WiFi-Watch-Dog: WiFi Attacks Using ESP32",
    "semester": "6th",
    "sr": 26,
    "certificateCode": "CSIUB-26-DF74-29PV"
  },
  {
    "id": "reg-df-075",
    "name": "Muhammad Shoaib",
    "isLeader": false,
    "teamName": "SNOPZ",
    "projectTitle": "WiFi-Watch-Dog: WiFi Attacks Using ESP32",
    "semester": "6th",
    "sr": 26,
    "certificateCode": "CSIUB-26-DF75-HQ7Q"
  },
  {
    "id": "reg-df-076",
    "name": "Muhammad Safiullah",
    "isLeader": false,
    "teamName": "SNOPZ",
    "projectTitle": "WiFi-Watch-Dog: WiFi Attacks Using ESP32",
    "semester": "6th",
    "sr": 26,
    "certificateCode": "CSIUB-26-DF76-Y7NL"
  },
  {
    "id": "reg-df-077",
    "name": "Luqman Khan",
    "isLeader": false,
    "teamName": "SNOPZ",
    "projectTitle": "WiFi-Watch-Dog: WiFi Attacks Using ESP32",
    "semester": "6th",
    "sr": 26,
    "certificateCode": "CSIUB-26-DF77-FN6G"
  },
  {
    "id": "reg-df-078",
    "name": "Zaheer Abbas",
    "isLeader": true,
    "teamName": "Cyber Nova",
    "projectTitle": "Advanced ARP Spoofing Detection & Prevention System",
    "semester": "6th",
    "sr": 27,
    "certificateCode": "CSIUB-26-DF78-W5NC"
  },
  {
    "id": "reg-df-079",
    "name": "Karamat Ali",
    "isLeader": false,
    "teamName": "Cyber Nova",
    "projectTitle": "Advanced ARP Spoofing Detection & Prevention System",
    "semester": "6th",
    "sr": 27,
    "certificateCode": "CSIUB-26-DF79-DL57"
  },
  {
    "id": "reg-df-080",
    "name": "Shaheer Ahmed",
    "isLeader": false,
    "teamName": "Cyber Nova",
    "projectTitle": "Advanced ARP Spoofing Detection & Prevention System",
    "semester": "6th",
    "sr": 27,
    "certificateCode": "CSIUB-26-DF80-U3M3"
  },
  {
    "id": "reg-df-081",
    "name": "Saifullah",
    "isLeader": false,
    "teamName": "Cyber Nova",
    "projectTitle": "Advanced ARP Spoofing Detection & Prevention System",
    "semester": "6th",
    "sr": 27,
    "certificateCode": "CSIUB-26-DF81-BJ5X"
  },
  {
    "id": "reg-df-082",
    "name": "Muhammad Asad ur Rehman",
    "isLeader": true,
    "teamName": "The Defenders",
    "projectTitle": "Smart Grid SCADA Honeypot with Real-Time Alerting",
    "semester": "6th",
    "sr": 28,
    "certificateCode": "CSIUB-26-DF82-SZLT"
  },
  {
    "id": "reg-df-083",
    "name": "Sharjeel Ibtisham",
    "isLeader": false,
    "teamName": "The Defenders",
    "projectTitle": "Smart Grid SCADA Honeypot with Real-Time Alerting",
    "semester": "6th",
    "sr": 28,
    "certificateCode": "CSIUB-26-DF83-9G4N"
  },
  {
    "id": "reg-df-084",
    "name": "Qazi Ayaan",
    "isLeader": false,
    "teamName": "The Defenders",
    "projectTitle": "Smart Grid SCADA Honeypot with Real-Time Alerting",
    "semester": "6th",
    "sr": 28,
    "certificateCode": "CSIUB-26-DF84-QXLJ"
  },
  {
    "id": "reg-df-085",
    "name": "M. Uzair",
    "isLeader": false,
    "teamName": "The Defenders",
    "projectTitle": "Smart Grid SCADA Honeypot with Real-Time Alerting",
    "semester": "6th",
    "sr": 28,
    "certificateCode": "CSIUB-26-DF85-7E3E"
  },
  {
    "id": "reg-df-086",
    "name": "Mahnoor Shafi",
    "isLeader": true,
    "teamName": "ICS DEFENDERS",
    "projectTitle": "Modbus TCP/IP Firewall for Industrial Control Systems",
    "semester": "6th",
    "sr": 29,
    "certificateCode": "CSIUB-26-DF86-NVKA"
  },
  {
    "id": "reg-df-087",
    "name": "Aqsa Batool",
    "isLeader": false,
    "teamName": "ICS DEFENDERS",
    "projectTitle": "Modbus TCP/IP Firewall for Industrial Control Systems",
    "semester": "6th",
    "sr": 29,
    "certificateCode": "CSIUB-26-DF87-5C35"
  },
  {
    "id": "reg-df-088",
    "name": "Ahmad Javed",
    "isLeader": true,
    "teamName": "Aegisora",
    "projectTitle": "Pentest Pro",
    "semester": "7th",
    "sr": 30,
    "certificateCode": "CSIUB-26-DF88-LTJZ"
  },
  {
    "id": "reg-df-089",
    "name": "Asma Razaq",
    "isLeader": false,
    "teamName": "Aegisora",
    "projectTitle": "Pentest Pro",
    "semester": "7th",
    "sr": 30,
    "certificateCode": "CSIUB-26-DF89-3A2V"
  },
  {
    "id": "reg-df-090",
    "name": "Samina Parveen",
    "isLeader": false,
    "teamName": "Aegisora",
    "projectTitle": "Pentest Pro",
    "semester": "7th",
    "sr": 30,
    "certificateCode": "CSIUB-26-DF90-JRJR"
  },
  {
    "id": "reg-df-091",
    "name": "Sikandar Hayat",
    "isLeader": true,
    "teamName": "Sikandar Hayat Team",
    "projectTitle": "Zero-Trust Healthcare Portal",
    "semester": "7th",
    "sr": 31,
    "certificateCode": "CSIUB-26-DF91-Z8ZL"
  },
  {
    "id": "reg-df-092",
    "name": "Abdul Moiz",
    "isLeader": false,
    "teamName": "Sikandar Hayat Team",
    "projectTitle": "Zero-Trust Healthcare Portal",
    "semester": "7th",
    "sr": 31,
    "certificateCode": "CSIUB-26-DF92-GPHG"
  },
  {
    "id": "reg-df-093",
    "name": "Nida Fatima",
    "isLeader": true,
    "teamName": "CyberShield",
    "projectTitle": "AI-Based Secure Smart City Monitoring System",
    "semester": "7th",
    "sr": 32,
    "certificateCode": "CSIUB-26-DF93-X6ZC"
  },
  {
    "id": "reg-df-094",
    "name": "Rubina Khadim",
    "isLeader": false,
    "teamName": "CyberShield",
    "projectTitle": "AI-Based Secure Smart City Monitoring System",
    "semester": "7th",
    "sr": 32,
    "certificateCode": "CSIUB-26-DF94-EMG8"
  },
  {
    "id": "reg-df-095",
    "name": "Zahra Bibi",
    "isLeader": false,
    "teamName": "CyberShield",
    "projectTitle": "AI-Based Secure Smart City Monitoring System",
    "semester": "7th",
    "sr": 32,
    "certificateCode": "CSIUB-26-DF95-V4Y3"
  },
  {
    "id": "reg-df-096",
    "name": "Shan Rasool",
    "isLeader": true,
    "teamName": "Threat Detector",
    "projectTitle": "AI-Based Insider Threat Detection System",
    "semester": "7th",
    "sr": 33,
    "certificateCode": "CSIUB-26-DF96-CKGX"
  },
  {
    "id": "reg-df-097",
    "name": "Faizan Manazir",
    "isLeader": false,
    "teamName": "Threat Detector",
    "projectTitle": "AI-Based Insider Threat Detection System",
    "semester": "7th",
    "sr": 33,
    "certificateCode": "CSIUB-26-DF97-T2XT"
  },
  {
    "id": "reg-df-098",
    "name": "Ahmed Ghaffari",
    "isLeader": false,
    "teamName": "Threat Detector",
    "projectTitle": "AI-Based Insider Threat Detection System",
    "semester": "7th",
    "sr": 33,
    "certificateCode": "CSIUB-26-DF98-AHFP"
  },
  {
    "id": "reg-df-099",
    "name": "M Amjad",
    "isLeader": true,
    "teamName": "M Amjad Team",
    "projectTitle": "Web Vulnerability Scanner",
    "semester": "7th",
    "sr": 34,
    "certificateCode": "CSIUB-26-DF99-RYXJ"
  },
  {
    "id": "reg-df-100",
    "name": "Aziz ur Rehman",
    "isLeader": false,
    "teamName": "M Amjad Team",
    "projectTitle": "Web Vulnerability Scanner",
    "semester": "7th",
    "sr": 34,
    "certificateCode": "CSIUB-26-DF100-8FEE"
  },
  {
    "id": "reg-df-101",
    "name": "Ali Hamza",
    "isLeader": false,
    "teamName": "M Amjad Team",
    "projectTitle": "Web Vulnerability Scanner",
    "semester": "7th",
    "sr": 34,
    "certificateCode": "CSIUB-26-DF101-PWWA"
  },
  {
    "id": "reg-df-102",
    "name": "Muhammad Zulqarnain",
    "isLeader": true,
    "teamName": "Muhammad Zulqarnain Team",
    "projectTitle": "Secure Feedback Management System",
    "semester": "7th",
    "sr": 35,
    "certificateCode": "CSIUB-26-DF102-6DE6"
  },
  {
    "id": "reg-df-103",
    "name": "Muzafar Khan",
    "isLeader": false,
    "teamName": "Muhammad Zulqarnain Team",
    "projectTitle": "Secure Feedback Management System",
    "semester": "7th",
    "sr": 35,
    "certificateCode": "CSIUB-26-DF103-MUVZ"
  },
  {
    "id": "reg-df-104",
    "name": "Ali Hassan",
    "isLeader": false,
    "teamName": "Muhammad Zulqarnain Team",
    "projectTitle": "Secure Feedback Management System",
    "semester": "7th",
    "sr": 35,
    "certificateCode": "CSIUB-26-DF104-4BDV"
  },
  {
    "id": "reg-df-105",
    "name": "Talha Faizan",
    "isLeader": true,
    "teamName": "ZeroThreat",
    "projectTitle": "Secure E-Commerce Platform with AI-Driven Feedback Moderation",
    "semester": "7th",
    "sr": 36,
    "certificateCode": "CSIUB-26-DF105-KSVR"
  },
  {
    "id": "reg-df-106",
    "name": "Umair Ashraf",
    "isLeader": false,
    "teamName": "ZeroThreat",
    "projectTitle": "Secure E-Commerce Platform with AI-Driven Feedback Moderation",
    "semester": "7th",
    "sr": 36,
    "certificateCode": "CSIUB-26-DF106-29CM"
  },
  {
    "id": "reg-df-107",
    "name": "Ahmad Hassan",
    "isLeader": false,
    "teamName": "ZeroThreat",
    "projectTitle": "Secure E-Commerce Platform with AI-Driven Feedback Moderation",
    "semester": "7th",
    "sr": 36,
    "certificateCode": "CSIUB-26-DF107-HQUG"
  },
  {
    "id": "reg-df-108",
    "name": "Muhammad Hamid",
    "isLeader": true,
    "teamName": "Cipher_Vote",
    "projectTitle": "Adaptive Secure Online Voting System",
    "semester": "7th",
    "sr": 37,
    "certificateCode": "CSIUB-26-DF108-Y7CC"
  },
  {
    "id": "reg-df-109",
    "name": "Anfal Tariq",
    "isLeader": false,
    "teamName": "Cipher_Vote",
    "projectTitle": "Adaptive Secure Online Voting System",
    "semester": "7th",
    "sr": 37,
    "certificateCode": "CSIUB-26-DF109-FNT8"
  },
  {
    "id": "reg-df-110",
    "name": "Saina Rizvi",
    "isLeader": true,
    "teamName": "Cloud Intrusion Detection",
    "projectTitle": "AI Powered Cloud Intrusion Detection System",
    "semester": "8th",
    "sr": 38,
    "certificateCode": "CSIUB-26-DF110-W5B4"
  },
  {
    "id": "reg-df-111",
    "name": "Musfira Hashmi",
    "isLeader": false,
    "teamName": "Cloud Intrusion Detection",
    "projectTitle": "AI Powered Cloud Intrusion Detection System",
    "semester": "8th",
    "sr": 38,
    "certificateCode": "CSIUB-26-DF111-DLTX"
  },
  {
    "id": "reg-df-112",
    "name": "Muhammad Mehmood ul Hassan",
    "isLeader": true,
    "teamName": "Group No. 15",
    "projectTitle": "Secure Tunnel: Private Cloud-Based VPN & Firewall",
    "semester": "8th",
    "sr": 39,
    "certificateCode": "CSIUB-26-DF112-U3AT"
  },
  {
    "id": "reg-df-113",
    "name": "Arham Ikhlaq",
    "isLeader": false,
    "teamName": "Group No. 15",
    "projectTitle": "Secure Tunnel: Private Cloud-Based VPN & Firewall",
    "semester": "8th",
    "sr": 39,
    "certificateCode": "CSIUB-26-DF113-BJSP"
  },
  {
    "id": "reg-df-114",
    "name": "Mahnoor Fatima",
    "isLeader": true,
    "teamName": "CloudGuard Security Provider",
    "projectTitle": "Never-Trust Verification Framework",
    "semester": "8th",
    "sr": 40,
    "certificateCode": "CSIUB-26-DF114-SZAK"
  },
  {
    "id": "reg-df-115",
    "name": "M. Basit",
    "isLeader": false,
    "teamName": "CloudGuard Security Provider",
    "projectTitle": "Never-Trust Verification Framework",
    "semester": "8th",
    "sr": 40,
    "certificateCode": "CSIUB-26-DF115-9G4W"
  },
  {
    "id": "reg-df-116",
    "name": "M Ahmad Khan",
    "isLeader": true,
    "teamName": "Security Implementers",
    "projectTitle": "Encrypted Docs with RBAC",
    "semester": "8th",
    "sr": 41,
    "certificateCode": "CSIUB-26-DF116-QXLS"
  },
  {
    "id": "reg-df-117",
    "name": "Muhammad Adil",
    "isLeader": false,
    "teamName": "Security Implementers",
    "projectTitle": "Encrypted Docs with RBAC",
    "semester": "8th",
    "sr": 41,
    "certificateCode": "CSIUB-26-DF117-7E3N"
  },
  {
    "id": "reg-df-118",
    "name": "Sohaib Ahmad",
    "isLeader": false,
    "teamName": "Security Implementers",
    "projectTitle": "Encrypted Docs with RBAC",
    "semester": "8th",
    "sr": 41,
    "certificateCode": "CSIUB-26-DF118-NVKJ"
  },
  {
    "id": "reg-df-119",
    "name": "Mujeeb ur Rehman",
    "isLeader": true,
    "teamName": "Cloud Defenders",
    "projectTitle": "CloudShield Pro",
    "semester": "8th",
    "sr": 42,
    "certificateCode": "CSIUB-26-DF119-5C3D"
  },
  {
    "id": "reg-df-120",
    "name": "Misbah Kanwal",
    "isLeader": false,
    "teamName": "Cloud Defenders",
    "projectTitle": "CloudShield Pro",
    "semester": "8th",
    "sr": 42,
    "certificateCode": "CSIUB-26-DF120-LTJ9"
  },
  {
    "id": "reg-df-121",
    "name": "Aroob Mukhtar",
    "isLeader": true,
    "teamName": "Aroob Mukhtar Team",
    "projectTitle": "AI Enhanced One-Time Secure Cloud Data Protection",
    "semester": "8th",
    "sr": 43,
    "certificateCode": "CSIUB-26-DF121-3A25"
  },
  {
    "id": "reg-df-122",
    "name": "M. Madni",
    "isLeader": false,
    "teamName": "Aroob Mukhtar Team",
    "projectTitle": "AI Enhanced One-Time Secure Cloud Data Protection",
    "semester": "8th",
    "sr": 43,
    "certificateCode": "CSIUB-26-DF122-JRJZ"
  },
  {
    "id": "reg-df-123",
    "name": "Faheem Abbas",
    "isLeader": true,
    "teamName": "Faheem Abbas Team",
    "projectTitle": "SecureVault",
    "semester": "8th",
    "sr": 44,
    "certificateCode": "CSIUB-26-DF123-Z8ZU"
  },
  {
    "id": "reg-df-124",
    "name": "Zain ul Abdeen",
    "isLeader": false,
    "teamName": "Faheem Abbas Team",
    "projectTitle": "SecureVault",
    "semester": "8th",
    "sr": 44,
    "certificateCode": "CSIUB-26-DF124-GPHQ"
  },
  {
    "id": "reg-df-125",
    "name": "Hafiz Aurangzaib",
    "isLeader": true,
    "teamName": "Hunter Guardian",
    "projectTitle": "SecureCloud Guardian",
    "semester": "8th",
    "sr": 45,
    "certificateCode": "CSIUB-26-DF125-X6ZL"
  },
  {
    "id": "reg-df-126",
    "name": "Syed Zia ur Rehman",
    "isLeader": false,
    "teamName": "Hunter Guardian",
    "projectTitle": "SecureCloud Guardian",
    "semester": "8th",
    "sr": 45,
    "certificateCode": "CSIUB-26-DF126-EMGG"
  },
  {
    "id": "reg-df-127",
    "name": "Asad Abbas",
    "isLeader": true,
    "teamName": "Secure File Sharing System",
    "projectTitle": "Secure File Sharing with Encryption",
    "semester": "8th",
    "sr": 46,
    "certificateCode": "CSIUB-26-DF127-V4YB"
  },
  {
    "id": "reg-df-128",
    "name": "Murtajiz Ali Khan",
    "isLeader": false,
    "teamName": "Secure File Sharing System",
    "projectTitle": "Secure File Sharing with Encryption",
    "semester": "8th",
    "sr": 46,
    "certificateCode": "CSIUB-26-DF128-CKG7"
  },
  {
    "id": "reg-df-129",
    "name": "Muhammad Taha",
    "isLeader": true,
    "teamName": "Cyber Duo",
    "projectTitle": "Cloud Log Anomaly Detector",
    "semester": "8th",
    "sr": 47,
    "certificateCode": "CSIUB-26-DF129-T2X3"
  },
  {
    "id": "reg-df-130",
    "name": "Hafiz Abdullah Sajid",
    "isLeader": false,
    "teamName": "Cyber Duo",
    "projectTitle": "Cloud Log Anomaly Detector",
    "semester": "8th",
    "sr": 47,
    "certificateCode": "CSIUB-26-DF130-AHFX"
  },
  {
    "id": "reg-df-131",
    "name": "Muhammad Tufail",
    "isLeader": true,
    "teamName": "Muhammad Tufail Team",
    "projectTitle": "AI Powered Detection Tool",
    "semester": "8th",
    "sr": 48,
    "certificateCode": "CSIUB-26-DF131-RYXS"
  },
  {
    "id": "reg-df-132",
    "name": "Shazia Jamil",
    "isLeader": false,
    "teamName": "Muhammad Tufail Team",
    "projectTitle": "AI Powered Detection Tool",
    "semester": "8th",
    "sr": 48,
    "certificateCode": "CSIUB-26-DF132-8FEN"
  },
  {
    "id": "reg-df-133",
    "name": "Muhammad Qasim",
    "isLeader": true,
    "teamName": "Azure Forensic Investigator Team",
    "projectTitle": "CloudForensics Platform",
    "semester": "8th",
    "sr": 49,
    "certificateCode": "CSIUB-26-DF133-PWWJ"
  },
  {
    "id": "reg-df-134",
    "name": "Umar Draz",
    "isLeader": false,
    "teamName": "Azure Forensic Investigator Team",
    "projectTitle": "CloudForensics Platform",
    "semester": "8th",
    "sr": 49,
    "certificateCode": "CSIUB-26-DF134-6DEE"
  },
  {
    "id": "reg-df-135",
    "name": "Muhammad Hamza Hayat",
    "isLeader": true,
    "teamName": "Cyber Rex",
    "projectTitle": "Automated Cloud Threat Detonation & SIEM Detection",
    "semester": "8th",
    "sr": 50,
    "certificateCode": "CSIUB-26-DF135-MUV9"
  },
  {
    "id": "reg-df-136",
    "name": "Asad Liaqat",
    "isLeader": false,
    "teamName": "Cyber Rex",
    "projectTitle": "Automated Cloud Threat Detonation & SIEM Detection",
    "semester": "8th",
    "sr": 50,
    "certificateCode": "CSIUB-26-DF136-4BD5"
  },
  {
    "id": "reg-df-137",
    "name": "Asma Mukhtiar",
    "isLeader": true,
    "teamName": "VaultSync",
    "projectTitle": "Cloud-Based Password Manager",
    "semester": "8th",
    "sr": 51,
    "certificateCode": "CSIUB-26-DF137-KSVZ"
  },
  {
    "id": "reg-df-138",
    "name": "Kishwar Ishfaq",
    "isLeader": false,
    "teamName": "VaultSync",
    "projectTitle": "Cloud-Based Password Manager",
    "semester": "8th",
    "sr": 51,
    "certificateCode": "CSIUB-26-DF138-29CV"
  },
  {
    "id": "reg-df-139",
    "name": "Atta Ullah",
    "isLeader": true,
    "teamName": "Team Wazir",
    "projectTitle": "Fishtrace",
    "semester": "8th",
    "sr": 52,
    "certificateCode": "CSIUB-26-DF139-HQUQ"
  },
  {
    "id": "reg-df-140",
    "name": "Ahmad Hassan",
    "isLeader": false,
    "teamName": "Team Wazir",
    "projectTitle": "Fishtrace",
    "semester": "8th",
    "sr": 52,
    "certificateCode": "CSIUB-26-DF140-Y7CL"
  },
  {
    "id": "reg-df-141",
    "name": "Muhammad Mubeen Nawaz",
    "isLeader": true,
    "teamName": "CloudPhantom",
    "projectTitle": "CloudPentest Framework",
    "semester": "8th",
    "sr": 53,
    "certificateCode": "CSIUB-26-DF141-FNTG"
  },
  {
    "id": "reg-df-142",
    "name": "Ayesha Amjad Ali",
    "isLeader": false,
    "teamName": "CloudPhantom",
    "projectTitle": "CloudPentest Framework",
    "semester": "8th",
    "sr": 53,
    "certificateCode": "CSIUB-26-DF142-W5BC"
  },
  {
    "id": "reg-df-143",
    "name": "Muhammad Zaid",
    "isLeader": true,
    "teamName": "SecurePulse",
    "projectTitle": "Cloud File Integrity Monitoring",
    "semester": "8th",
    "sr": 54,
    "certificateCode": "CSIUB-26-DF143-DLT7"
  },
  {
    "id": "reg-df-144",
    "name": "Bushra Noreen",
    "isLeader": false,
    "teamName": "SecurePulse",
    "projectTitle": "Cloud File Integrity Monitoring",
    "semester": "8th",
    "sr": 54,
    "certificateCode": "CSIUB-26-DF144-U3A3"
  },
  {
    "id": "reg-df-145",
    "name": "Rabeeza Mehmood Ali",
    "isLeader": true,
    "teamName": "Alpha",
    "projectTitle": "SENTINEL: ML-Powered Cloud Security Operations Platform",
    "semester": "8th",
    "sr": 56,
    "certificateCode": "CSIUB-26-DF145-BJSX"
  },
  {
    "id": "reg-df-146",
    "name": "Isha Fatima",
    "isLeader": false,
    "teamName": "Alpha",
    "projectTitle": "SENTINEL: ML-Powered Cloud Security Operations Platform",
    "semester": "8th",
    "sr": 56,
    "certificateCode": "CSIUB-26-DF146-SZAT"
  },
  {
    "id": "reg-df-147",
    "name": "Afifa Yasin",
    "isLeader": true,
    "teamName": "Alpha",
    "projectTitle": "AI-Powered Multi-Cloud Misconfiguration Detection Platform",
    "semester": "8th",
    "sr": 57,
    "certificateCode": "CSIUB-26-DF147-9GRN"
  },
  {
    "id": "reg-df-148",
    "name": "Muhammad Zohaib",
    "isLeader": false,
    "teamName": "Alpha",
    "projectTitle": "AI-Powered Multi-Cloud Misconfiguration Detection Platform",
    "semester": "8th",
    "sr": 57,
    "certificateCode": "CSIUB-26-DF148-QX9J"
  },
  {
    "id": "reg-df-149",
    "name": "Muhammad Luqman Rasheed",
    "isLeader": true,
    "teamName": "Cybrion Security",
    "projectTitle": "API Abuse Detection Tool",
    "semester": "8th",
    "sr": 58,
    "certificateCode": "CSIUB-26-DF149-7ERE"
  },
  {
    "id": "reg-df-150",
    "name": "Kainat Akbar",
    "isLeader": false,
    "teamName": "Cybrion Security",
    "projectTitle": "API Abuse Detection Tool",
    "semester": "8th",
    "sr": 58,
    "certificateCode": "CSIUB-26-DF150-NV8A"
  },
  {
    "id": "reg-df-151",
    "name": "Yashal Farooqi",
    "isLeader": true,
    "teamName": "Cloud Defender",
    "projectTitle": "Sentrix",
    "semester": "8th",
    "sr": 59,
    "certificateCode": "CSIUB-26-DF151-5CQ5"
  },
  {
    "id": "reg-df-152",
    "name": "Laiba Shoaib",
    "isLeader": false,
    "teamName": "Cloud Defender",
    "projectTitle": "Sentrix",
    "semester": "8th",
    "sr": 59,
    "certificateCode": "CSIUB-26-DF152-LT8Z"
  },
  {
    "id": "reg-df-153",
    "name": "Momina Rehman",
    "isLeader": true,
    "teamName": "Alpha",
    "projectTitle": "Deep Learning Driven Dark Web Threat Intelligence Platform",
    "semester": "8th",
    "sr": 60,
    "certificateCode": "CSIUB-26-DF153-3APV"
  },
  {
    "id": "reg-df-154",
    "name": "Sana Younis",
    "isLeader": false,
    "teamName": "Alpha",
    "projectTitle": "Deep Learning Driven Dark Web Threat Intelligence Platform",
    "semester": "8th",
    "sr": 60,
    "certificateCode": "CSIUB-26-DF154-JR7R"
  },
  {
    "id": "reg-df-155",
    "name": "Atika Athar",
    "isLeader": true,
    "teamName": "Amika",
    "projectTitle": "HoneypotX: AI-Powered Cloud Honeypot for Cyber Threat Detection",
    "semester": "8th",
    "sr": 61,
    "certificateCode": "CSIUB-26-DF155-Z8PL"
  },
  {
    "id": "reg-df-156",
    "name": "Amina Naseem",
    "isLeader": false,
    "teamName": "Amika",
    "projectTitle": "HoneypotX: AI-Powered Cloud Honeypot for Cyber Threat Detection",
    "semester": "8th",
    "sr": 61,
    "certificateCode": "CSIUB-26-DF156-GP6G"
  }
];
