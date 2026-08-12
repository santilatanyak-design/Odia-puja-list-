export type Language = 'OD' | 'EN';

export const translations = {
  OD: {
    // Navbar
    appTitle: "ପୂଜା ସାମଗ୍ରୀ",
    appSubtitle: "ସୂଚୀ ଜେନେରେଟର",
    navSubtitle: "ପୂଜାରୀ ପୋର୍ଟାଲ ଓ ଆଡମିନ୍ ପରିଚାଳନା ସିଷ୍ଟମ୍",
    rolePujari: "ପୂଜାରୀ",
    roleAdmin: "ଆଡମିନ୍",
    firstListFree: "୧ମ ପୂଜା ସୂଚୀ ମାଗଣା (FREE)!",
    firstListUsed: "୧ମ ସୂଚୀ ବ୍ୟବହୃତ (ନୂଆ ସୂଚୀ: ₹୫)",
    downloadApp: "ଏବେ ଆପ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ",
    downloadAppShort: "ଆପ୍ ଡାଉନଲୋଡ୍",
    appInstalled: "ଆପ୍ ସଂସ୍ଥାପିତ (Installed)",

    // Login & Register Page
    title: "ପୂଜାରୀ ଲଗଇନ୍ ଓ ପଞ୍ଜୀକରଣ",
    subtitle: "ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ ପ୍ରସ୍ତୁତି ଓ ପରିଚାଳନା ପୋର୍ଟାଲ",
    freeBenefitTitle: "ପୂଜାରୀଙ୍କ ପାଇଁ ସ୍ୱତନ୍ତ୍ର ସୁବିଧା:",
    freeBenefitDesc: "ଆପଣଙ୍କ ପ୍ରଥମ ପୂଜା ସୂଚୀ ୧୦୦% ମାଗଣା (FREE)! ତୁରନ୍ତ PDF ଡାଉନଲୋଡ୍ କରନ୍ତୁ। ପରବର୍ତ୍ତୀ ପ୍ରତ୍ୟେକ ସୂଚୀ ପାଇଁ ମାତ୍ର ₹୫ ଦେୟ ପ୍ରଯୁଜ୍ୟ।",
    presetLoginText: "ପ୍ରେସେଟ୍ ପୂଜାରୀ ID ଦ୍ୱାରା ତୁରନ୍ତ ଲଗଇନ୍ କରନ୍ତୁ:",
    loginBtn: "ଲଗଇନ୍ (Login)",
    registerBtn: "ନୂତନ ପଞ୍ଜୀକରଣ (Register)",
    mobileLabel: "ପୂଜାରୀ ID କିମ୍ବା ମୋବାଇଲ୍ ନମ୍ବର",
    mobilePlaceholder: "ଉଦାହରଣ: PJR-1001 କିମ୍ବା 9876543210",
    pinLabel: "4-Digit PIN (ଗୁପ୍ତ ପିନ୍)",
    enterBtn: "ପୂଜାରୀ ପୋର୍ଟାଲରେ ପ୍ରବେଶ କରନ୍ତୁ",
    loggingIn: "ପ୍ରବେଶ ହେଉଛି...",
    forgotPinLink: "ଆଇଡି କିମ୍ବା ପିନ୍ ଭୁଲିଯାଇଛନ୍ତି କି? (Forgot ID / PIN?)",

    // Registration Form
    regFullName: "ପୂଜାରୀଙ୍କ ପୂରା ନାମ (ପଣ୍ଡିତ ଜୀଙ୍କ ନାମ)",
    regFullNamePlaceholder: "ଉଦାହରଣ: ପଣ୍ଡିତ ରମେଶ ଶର୍ମା",
    regMobileNumber: "ମୋବାଇଲ୍ ନମ୍ବର",
    regAddress: "ଠିକଣା / ସହର",
    regAddressPlaceholder: "ଉଦାହରଣ: ଭୁବନେଶ୍ୱର",
    regPinNotice: "(ଏହି ୪-ଅଙ୍କ ପିନ୍ କୁ ମନେ ରଖନ୍ତୁ, ଏହା ଲଗଇନ୍ ପାଇଁ ଦରକାର ହେବ)",
    registering: "ପଞ୍ଜୀକରଣ ହେଉଛି...",
    regSubmitBtn: "ନୂତନ ଆକାଉଣ୍ଟ ପଞ୍ଜୀକରଣ କରନ୍ତୁ",

    // Account Recovery
    recoveryBack: "ଫେରନ୍ତୁ (Back to Login)",
    recoveryTitle: "ଆକାଉଣ୍ଟ ପୁନରୁଦ୍ଧାର",
    recoveryHintTitle: "💡 ଆଇଡି କିମ୍ବା PIN ଭୁଲିଯାଇଛନ୍ତି?",
    recoveryHintDesc: "ଆପଣଙ୍କର ପଞ୍ଜୀକୃତ ମୋବାଇଲ୍ ନମ୍ବର ଦେଇ ଆପଣଙ୍କର ପୂଜାରୀ ID ଖୋଜନ୍ତୁ ଏବଂ ନୂତନ PIN ସେଟ୍ କରନ୍ତୁ।",
    regMobileLabel: "ପଞ୍ଜୀକୃତ ମୋବାଇଲ୍ ନମ୍ବର (Registered Mobile No)",
    searchAccountBtn: "ଖୋଜନ୍ତୁ (Search Account)",
    searching: "ଖୋଜାଚାଲିଛି...",
    accountFound: "ଆକାଉଣ୍ଟ ମିଳିଗଲା! (Account Found)",
    yourPujariId: "ଆପଣଙ୍କର ପୂଜାରୀ ID:",
    newPinLabel: "ନୂଆ 4-Digit PIN (New PIN)",
    confirmPinLabel: "ନୂଆ PIN ନିଶ୍ଚିତ କରନ୍ତୁ (Confirm New PIN)",
    resetPinBtn: "PIN ବଦଳାନ୍ତୁ (Reset PIN)",
    resetting: "ବଦଳାଯାଉଛି...",

    // Admin Link
    areYouAdmin: "ଆପଣ ଆଡମିନ୍ ଅଟନ୍ତି କି?",
    adminPortalBtn: "ଆଡମିନ୍ ପୋର୍ଟାଲ୍",

    // Registration Success Modal
    regSuccessTitle: "ପଞ୍ଜୀକରଣ ସଫଳ ହୋଇଛି! 🎉",
    regSuccessSubtitle: "ଆପଣଙ୍କ ପୂଜାରୀ ଆକାଉଣ୍ଟ ସଫଳତାର ସହ ପ୍ରସ୍ତୁତ ହୋଇଗଲା।",
    autoPujariIdLabel: "ଆପଣଙ୍କର ସ୍ୱୟଂଚାଳିତ ପୂଜାରୀ ID (Auto Pujari ID)",
    regSuccessNote1: "ପଞ୍ଜୀକରଣ ସଫଳ ହୋଇଛି! ଆପଣଙ୍କର ପୂଜାରୀ ID ହେଉଛି",
    regSuccessNote2: "। ଦୟାକରି ଏହାକୁ ମନେ ରଖନ୍ତୁ। ଆଡମିନ୍ଙ୍କ ଅନୁମୋଦନ ପରେ ଆପଣ ଲଗଇନ୍ କରିପାରିବେ।",
    enterPortalBtn: "ପୂଜାରୀ ପୋର୍ଟାଲରେ ପ୍ରବେଶ କରନ୍ତୁ"
  },
  EN: {
    // Navbar
    appTitle: "Puja Samagri",
    appSubtitle: "List Generator",
    navSubtitle: "Pujari Portal & Admin Management System",
    rolePujari: "Pujari",
    roleAdmin: "Admin",
    firstListFree: "1st Puja List FREE!",
    firstListUsed: "1st List Used (New List: ₹5)",
    downloadApp: "Download App Now",
    downloadAppShort: "Download App",
    appInstalled: "App Installed",

    // Login & Register Page
    title: "Pujari Login & Registration",
    subtitle: "Puja Samagri List Generator & Management Portal",
    freeBenefitTitle: "Special Benefits for Pujaris:",
    freeBenefitDesc: "Your first Puja List is 100% FREE! Download PDF instantly. Only ₹5 for each subsequent list.",
    presetLoginText: "Quick Login with Preset Pujari ID:",
    loginBtn: "Login",
    registerBtn: "New Register",
    mobileLabel: "Pujari ID or Mobile No",
    mobilePlaceholder: "Example: PJR-1001 or 9876543210",
    pinLabel: "4-Digit Secret PIN",
    enterBtn: "Enter Pujari Portal",
    loggingIn: "Entering...",
    forgotPinLink: "Forgot ID / PIN?",

    // Registration Form
    regFullName: "Pujari Full Name (Pandit Ji Name)",
    regFullNamePlaceholder: "Example: Pandit Ramesh Sharma",
    regMobileNumber: "Mobile Number",
    regAddress: "Address / City",
    regAddressPlaceholder: "Example: Bhubaneswar",
    regPinNotice: "(Remember this 4-digit PIN for future logins)",
    registering: "Registering...",
    regSubmitBtn: "Register New Account",

    // Account Recovery
    recoveryBack: "Back to Login",
    recoveryTitle: "Account Recovery",
    recoveryHintTitle: "💡 Forgot ID or PIN?",
    recoveryHintDesc: "Search your Pujari ID using your registered mobile number and set a new PIN.",
    regMobileLabel: "Registered Mobile No",
    searchAccountBtn: "Search Account",
    searching: "Searching...",
    accountFound: "Account Found!",
    yourPujariId: "Your Pujari ID:",
    newPinLabel: "New 4-Digit PIN",
    confirmPinLabel: "Confirm New PIN",
    resetPinBtn: "Reset PIN",
    resetting: "Resetting...",

    // Admin Link
    areYouAdmin: "Are you an Admin?",
    adminPortalBtn: "Admin Portal",

    // Registration Success Modal
    regSuccessTitle: "Registration Successful! 🎉",
    regSuccessSubtitle: "Your Pujari account has been successfully created.",
    autoPujariIdLabel: "Your Auto-Generated Pujari ID",
    regSuccessNote1: "Registration successful! Your Pujari ID is",
    regSuccessNote2: ". Please remember this for future logins.",
    enterPortalBtn: "Enter Pujari Portal"
  }
};
