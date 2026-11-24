const byId = (id) => document.getElementById(id);
let current = 0;
let rackTimer = null;

function element(tag, text, className) {
  const result = document.createElement(tag);
  if (text) result.textContent = text;
  if (className) result.className = className;
  return result;
}

function action(label, handler) {
  const button = element('button', label);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

function svg(title, body, size = '0 0 660 350') {
  byId('canvas').innerHTML = `<svg viewBox="${size}" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
    <style>
      text{fill:#eceafa;font:16px system-ui} .small{font:13px ui-monospace,monospace;fill:#bac1df}
      .device{fill:#211f3a;stroke:#827cce;stroke-width:2} .port{fill:#0b0a15;stroke:#aba7ef}
      .wire{fill:none;stroke:#766dbc;stroke-width:3;stroke-linecap:round}
      .signal{stroke:#75dcff;stroke-width:4;stroke-dasharray:9 6;animation:pulse 1.6s linear infinite}
      .move{animation:seat 2.4s ease-out both;transform-box:fill-box;transform-origin:center}
      .focus{stroke:#75dcff;stroke-width:3;fill:none}
      @keyframes pulse{to{stroke-dashoffset:-30}} @keyframes seat{from{transform:translateX(110px)}to{transform:translateX(0)}}
      @media(prefers-reduced-motion:reduce){.move,.signal{animation:none}}
    </style>${body}</svg>`;
}

function monitor(x, y, label) {
  return `<g transform="translate(${x} ${y})"><rect class="device" width="56" height="36" rx="4"/>
    <path class="wire" d="M28 36v10m-13 0h26"/><text x="28" y="67" text-anchor="middle">${label}</text></g>`;
}

function networkDiagram(mode = '') {
  svg('Two PCs lead to switch SW1. Router R1 leads to another network.', `
    <path class="wire ${mode ? 'signal' : ''}" d="M110 100H220V153H278"/>
    <path class="wire ${mode === 'local' ? 'signal' : ''}" d="M110 250H220V175H278"/>
    <path class="wire ${mode === 'remote' ? 'signal' : ''}" d="M365 163H451M509 163H568"/>
    ${monitor(54,82,'PC-A')}${monitor(54,231,'PC-B')}
    <rect x="278" y="142" width="87" height="42" rx="5" class="device"/>
    ${[291,306,321,336,351].map(x=>`<rect class="port" x="${x}" y="155" width="7" height="10"/>`).join('')}
    <text x="322" y="213" text-anchor="middle">SW1</text>
    <circle cx="480" cy="163" r="29" class="device"/><path class="wire" d="M467 159l13-9 13 9m-26 8 13 9 13-9"/>
    <text x="480" y="213" text-anchor="middle">R1</text>
    <rect x="568" y="143" width="65" height="40" class="device" rx="5"/>
    <text x="600" y="213" text-anchor="middle">Remote</text>
    <text x="54" y="317" class="small">PC-A 192.168.10.20  ·  Gateway 192.168.10.1</text>`);
}

const frontFrames = [
  ['Choose rack units','Patch panel at U20, cable manager at U19, switch at U18. Match the approved rack plan and airflow.'],
  ['Mount the patch panel','Hold the panel at U20. Pass the matching rack screws through its mounting ears into the rail threads or cage nuts. Secure both sides before terminating the cable.'],
  ['Fit the chassis ears','The small model-specific screws attach each ear to the switch chassis. Use the holes shown in the model guide.'],
  ['Lift and align','Support the chassis as it slides into U18. Align both bracket ears with the same rack unit.'],
  ['Fasten the ears to the rails','Rack screws pass through the ears into the matching rail threads or cage nuts. Keep supporting the chassis until secure.']
];
const rearFrames = [
  ['Identify the rear ports','Read the labels on your model. This illustration places optional StackWise on the left, fans in the center, and power to the right.'],
  ['Run power to the PDU','Connect the approved power cord from the rear power inlet to the assigned rack PDU. Keep cables clear of the fans.'],
  ['Choose the correct network connection','Use the front network ports for a server NIC or a switch uplink in this example. Rear StackWise ports are for compatible stack mates and dedicated cables.']
];
const patchFrames = [
  ['Rear IDC termination','Seat the horizontal cable conductors into the IDC terminals by the panel color legend. The wall jack uses the same chosen T568 scheme.'],
  ['Front patch cord','Connect PP-01 on the patch panel front to Gi1/0/1 on SW1. The patch panel has no IP address or switching logic.'],
  ['Switch uplink and server','Patch Gi1/0/24 to the matching uplink on SW2. A server NIC can go to its assigned access port, Gi1/0/20 in this example.'],
  ['Label and test','Trace desk D-01 → PP-01 → SW1 Gi1/0/1. Record the labels and confirm wiremap, link, and expected VLAN.']
];

function rackPicture(rear, phase) {
  const rack = `<path class="device" d="M83 39h415v265H83z"/><path fill="#0c0c17" d="M107 49h367v244H107z"/>
    ${[101,480].map(x=>`<path stroke="#7772a3" stroke-width="7" stroke-dasharray="2 8" d="M${x} 55v233"/>`).join('')}
    <text class="small" x="47" y="100">U20</text><text class="small" x="47" y="154">U19</text><text class="small" x="47" y="216">U18</text>
    <g class="${!rear && phase===1?'move':''}"><rect class="device" x="98" y="76" width="384" height="43" rx="3"/>
    ${!rear && phase===1?'<circle class="focus" cx="104" cy="98" r="6"/><circle class="focus" cx="476" cy="98" r="6"/>':''}
    <text x="290" y="101" text-anchor="middle">${rear?'Patch panel rear / IDC':'Patch panel front'}</text></g>
    <rect class="device" x="106" y="130" width="368" height="36" rx="3"/>
    <text x="290" y="153" text-anchor="middle">Cable manager</text>`;
  const front = `<g class="${phase===3?'move':''}" transform="translate(${phase===2?110:0} 0)">
    <rect class="device" x="118" y="187" width="344" height="51" rx="4"/>
    <rect class="device" x="99" y="188" width="19" height="49"/><rect class="device" x="462" y="188" width="19" height="49"/>
    ${Array.from({length:12},(_,i)=>`<rect class="port" x="${143+i*23}" y="202" width="14" height="12" rx="2"/>`).join('')}
    ${(phase===2?[121,459]:phase===4?[108,472]:[]).map(x=>`<circle class="focus" cx="${x}" cy="212" r="7"/><path class="wire" d="M${x-3} 212h6"/>`).join('')}
    </g>`;
  const back = `<rect class="device" x="106" y="187" width="368" height="51" rx="4"/>
    <rect class="port" x="123" y="201" width="54" height="23"/><text class="small" x="183" y="222">STACK</text>
    <circle class="port" cx="267" cy="212" r="17"/><circle class="port" cx="311" cy="212" r="17"/>
    <rect class="port" x="411" y="198" width="42" height="28"/><text class="small" x="405" y="257">POWER</text>
    <rect class="device" x="537" y="153" width="70" height="110" rx="4"/><text x="550" y="181">PDU</text>
    ${phase===1?'<path class="wire signal" d="M453 213h84"/>':''}
    ${phase===2?'<path class="wire signal" d="M123 214H77v53h100"/><text class="small" x="186" y="271">Optional compatible stack mate</text>':''}`;
  svg(rear ? 'Rear rack diagram with optional stack ports, fan modules and PDU' : 'Front rack diagram with patch panel, cable manager, switch ears and rack screws',
      rack+(rear?back:phase>1?front:'<rect class="focus" x="107" y="187" width="366" height="51" stroke-dasharray="8 6"/>'));
}

function patchPicture(phase) {
  const pairs = ['#f1f1ff','#e69749','#f1f1ff','#65aafa','#f1f1ff','#5ed2a3','#f1f1ff','#bc8a64'];
  const idcDetail = `<text class="small" x="24" y="233">T568B pin order · follow the label on your panel</text>
    ${pairs.map((color,index)=>`<path stroke="${color}" stroke-width="4" d="M${32+index*23} 245v27"/>
      <rect class="port" x="${26+index*23}" y="272" width="12" height="14"/><text class="small" x="${28+index*23}" y="304">${index+1}</text>`).join('')}`;
  svg('Copper path from desk to rear IDC, front patch cord to switch, and separate switch uplink and server connections', `
    ${monitor(28,95,'Desk D-01')}
    <path class="wire ${phase===0||phase===3?'signal':''}" d="M84 113h96"/>
    <rect class="device" x="180" y="66" width="140" height="102" rx="5"/>
    <text x="250" y="90" text-anchor="middle">Patch panel</text>
    <rect class="port" x="193" y="105" width="45" height="23"/><rect class="port" x="262" y="105" width="45" height="23"/>
    <path class="wire" d="M238 116h24"/><text class="small" x="191" y="148">Rear IDC</text><text class="small" x="257" y="148">Front 01</text>
    <path class="wire ${phase===1||phase===3?'signal':''}" d="M307 116h101"/>
    <rect class="device" x="408" y="80" width="194" height="77" rx="5"/>
    <text x="505" y="105" text-anchor="middle">SW1 front</text>
    <text class="small" x="414" y="140">Gi1/0/1</text><text class="small" x="479" y="140">/20</text><text class="small" x="551" y="140">/24</text>
    <path class="wire ${phase===2?'signal':''}" d="M491 157v61H371v44M565 157v105"/>
    <rect class="device" x="316" y="262" width="110" height="40" rx="4"/><text x="371" y="288" text-anchor="middle">Server NIC</text>
    <rect class="device" x="510" y="262" width="110" height="40" rx="4"/><text x="565" y="288" text-anchor="middle">SW2 uplink</text>
    <text class="small" x="24" y="204">Wall jack → permanent cable → IDC</text>
    ${phase===0?idcDetail:''}`);
}

const serverFrames = [
  ['Identify the ports', 'Find NIC 1, the dedicated BMC jack, and PSU 1 and PSU 2 on SRV1. Find Gi1/0/20 on the switch front.'],
  ['Connect the data cable', 'Blue Cat6 Ethernet: SRV1 NIC 1 → SW1 Gi1/0/20. Label both ends and check that both plugs latch.'],
  ['Connect management', 'Purple Cat6 Ethernet: SRV1 BMC → management switch Gi1/0/8. Confirm the management VLAN and authorized access path.'],
  ['Connect power', 'Approved AC cord: PSU 1 → PDU A. Second approved AC cord: PSU 2 → PDU B, where independent feeds are provided.'],
  ['Check the links', 'Inspect power and link indicators. Trace the cable labels again. Then use the switch console to confirm the data port’s status.']
];

const bootFrames = [
  ['Power up the switch', 'Watch the vendor startup messages. Wait for the system status to settle and the switch console to load.'],
  ['Insert approved server USB', 'Insert the prepared bootable USB into the server’s data USB port. Confirm this is the blank lab server.'],
  ['Choose the one-time boot device', 'Use the server’s model-specific boot menu and choose UEFI: Approved OS USB. This only sets the current boot choice.'],
  ['Install on the intended disk', 'Check the installer and the approved target volume. Confirm before writing. In an enterprise, the same OS may be delivered with virtual media or PXE.'],
  ['Start from the installed disk', 'Eject installer media as directed. Boot the internal disk, verify the OS starts, and record hostname and NIC details.']
];

function serverPicture(phase) {
  const finals = [
    ['M120 145v126','#75dcff',1],
    ['M248 145v70h37v56','#c295ff',2],
    ['M443 145v121','#ffc883',3],
    ['M556 145v121','#f6a98b',3]
  ];
  const wires = finals.filter((entry)=>phase>=entry[2]).map(([d,color,start])=>
    `<path class="cable ${phase===start?'plugging':''}" pathLength="1" style="--cable:${color}" d="${d}"/>`).join('');
  svg('Close-up of SRV1 rear and SW1 front. Separate Cat6 data and management connections and two AC power feeds.', `
    <text x="40" y="35">SRV1 · rear panel</text>
    <rect class="device" x="40" y="52" width="580" height="115" rx="8"/>
    <rect class="port" x="92" y="99" width="56" height="46" rx="4"/>
    <path class="wire" d="M103 135h34m-27-20v11m9-11v11m9-11v11"/>
    <rect class="port" x="220" y="99" width="56" height="46" rx="4"/>
    <path class="wire" d="M231 135h34m-27-20v11m9-11v11m9-11v11"/>
    <circle class="port" cx="340" cy="119" r="23"/><path class="wire" d="M329 119h22m-11-11v22"/>
    <rect class="port" x="416" y="99" width="54" height="46" rx="5"/>
    <rect class="port" x="529" y="99" width="54" height="46" rx="5"/>
    <text class="small" x="92" y="90">NIC 1</text><text class="small" x="220" y="90">BMC</text>
    <text class="small" x="416" y="90">PSU 1</text><text class="small" x="529" y="90">PSU 2</text>
    ${wires}
    <rect class="device" x="29" y="266" width="180" height="71" rx="6"/>
    <rect class="device" x="220" y="266" width="133" height="71" rx="6"/>
    <rect class="device" x="396" y="266" width="94" height="71" rx="6"/>
    <rect class="device" x="509" y="266" width="94" height="71" rx="6"/>
    <rect class="port" x="108" y="271" width="24" height="12"/>
    <rect class="port" x="273" y="271" width="24" height="12"/>
    <text x="119" y="308" text-anchor="middle">SW1 · front</text>
    <text class="small" x="119" y="326" text-anchor="middle">Gi1/0/20 · Cat6</text>
    <text x="286" y="308" text-anchor="middle">Mgmt switch</text>
    <text class="small" x="286" y="326" text-anchor="middle">Gi1/0/8 · Cat6</text>
    <text x="443" y="308" text-anchor="middle">PDU A</text>
    <text x="556" y="308" text-anchor="middle">PDU B</text>
    <text class="small" x="443" y="326" text-anchor="middle">AC cord</text>
    <text class="small" x="556" y="326" text-anchor="middle">AC cord</text>
    ${phase===4?'<circle fill="#85f8bd" cx="141" cy="277" r="5"/><circle fill="#85f8bd" cx="308" cy="277" r="5"/>':''}
    <text class="small" x="39" y="372">Physical port locations are illustrative. Check your model labels.</text>`, '0 0 660 395');
}

function bootPicture(phase) {
  const messages = [
    ['SW1 console','System boot complete','SW1>'],
    ['SRV1 firmware','USB media detected','Open the one-time boot menu'],
    ['SRV1 · UEFI boot menu','Selected: UEFI: Approved OS USB','Internal disk is unchanged'],
    ['SRV1 installer','Select the approved target volume','Confirm before writing to disk'],
    ['SRV1 installed OS','Internal disk selected · USB removed','Record NIC 1 and verify switch port']
  ];
  const [title,line,next]=messages[phase];
  svg('Switch console and server USB installation, with labeled boot progress', `
    <text x="45" y="36">SRV1 · front panel</text>
    <rect class="device" x="45" y="52" width="537" height="68" rx="7"/>
    <circle fill="#85f8bd" cx="78" cy="85" r="7"/><text class="small" x="96" y="90">Power</text>
    <rect class="port" x="449" y="77" width="44" height="17" rx="3"/><text class="small" x="399" y="91">USB</text>
    ${phase>=1&&phase<=3?`<g class="${phase===1?'usb-in':''}">
      <rect x="484" y="79" width="34" height="12" fill="#9babc3"/>
      <rect class="device" x="509" y="71" width="91" height="28" rx="5"/>
      <text class="small" x="555" y="90" text-anchor="middle">OS USB</text></g>`:''}
    <rect class="device" x="45" y="153" width="573" height="163" rx="8"/>
    <text x="66" y="190">${title}</text>
    <path class="wire" d="M65 207h534"/>
    <text class="small" x="66" y="244">${line}</text>
    <text class="small" x="66" y="277">${next}</text>`);
}

function portPicture() {
  svg('Server NIC 1 over Cat6 to switch SW1 interface Gi1/0/20, labeled access VLAN 20', `
    <rect class="device" x="45" y="89" width="196" height="91" rx="6"/>
    <text x="65" y="120">SRV1 · rear</text><text class="small" x="65" y="148">NIC 1</text>
    <rect class="port" x="201" y="123" width="37" height="25" rx="3"/>
    <path class="wire signal" d="M241 135h165"/>
    <text class="small" x="319" y="118" text-anchor="middle">Cat6</text>
    <rect class="device" x="406" y="89" width="207" height="91" rx="6"/>
    <rect class="port" x="409" y="123" width="37" height="25" rx="3"/>
    <text x="465" y="119">SW1 · front</text><text class="small" x="465" y="148">Gi1/0/20</text>
    <text class="small" x="405" y="221">Approved setting: Access VLAN 20</text>
    <text class="small" x="45" y="250">Verify link → VLAN → MAC → gateway</text>`);
}

function physicalVisual(kind) {
  let rear = false;
  let phase = 0;
  const description = element('p');
  const play = action('Play slowly', () => {
    if (rackTimer !== null) { stop(); return; }
    if (phase === frames().length - 1) { phase = 0; draw(); }
    play.textContent = 'Pause';
    rackTimer = setInterval(() => {
      advance();
      if (phase === frames().length - 1) stop();
    }, 3600);
  });
  function frames() {
    if (kind === 'patch') return patchFrames;
    if (kind === 'server') return serverFrames;
    if (kind === 'boot') return bootFrames;
    return rear ? rearFrames : frontFrames;
  }
  function stop() { clearInterval(rackTimer); rackTimer = null; play.textContent = 'Play slowly'; }
  function advance() { phase = Math.min(phase+1,frames().length-1); draw(); }
  const back = action('Previous action', () => { stop(); phase=Math.max(0,phase-1); draw(); });
  const next = action('Next action', () => { stop(); advance(); });
  function draw() {
    const [title, text] = frames()[phase];
    byId('visual-status').textContent = (phase+1) + ' / ' + frames().length;
    description.textContent = title + '. ' + text;
    back.disabled = phase === 0;
    next.disabled = phase === frames().length-1;
    if (kind === 'patch') patchPicture(phase);
    else if (kind === 'server') serverPicture(phase);
    else if (kind === 'boot') bootPicture(phase);
    else rackPicture(rear, phase);
  }
  if (kind === 'rack') byId('visual-controls').append(action('Front view', () => { stop(); rear=false; phase=0; draw(); }),
    action('Rear view', () => { stop(); rear=true; phase=0; draw(); }));
  byId('visual-controls').append(back, play, next, description);
  draw();
}

function subnetVisual() {
  const panel = element('div', '', 'subnet-grid');
  const form = element('form', '', 'address-form');
  const prefix = element('select');
  prefix.setAttribute('aria-label','Subnet prefix');
  for (const n of [24,25,26,27,28]) prefix.append(new Option('/'+n,n,n===26,n===26));
  const octet = element('input');
  octet.type='number'; octet.min=0; octet.max=255; octet.required=true; octet.value=77;
  octet.setAttribute('aria-label','Last IP octet');
  const description=element('p');
  description.setAttribute('role','status');
  const button=element('button','Find block');
  button.type='submit';
  form.append(prefix,octet,button);
  function draw() {
    const block=2**(32-Number(prefix.value));
    const start=Math.floor(Number(octet.value)/block)*block;
    panel.replaceChildren(...Array.from({length:256/block},(_,i)=>{
      const from=i*block;
      return element('div', from+'–'+(from+block-1), from===start?'active':'');
    }));
    description.textContent='192.168.10.'+start+'/'+prefix.value+' · first host .'+(start+1)+' · last host .'+(start+block-2)+' · broadcast .'+(start+block-1);
  }
  form.addEventListener('submit',event=>{event.preventDefault();draw();});
  byId('canvas').append(panel);
  byId('visual-controls').append(form,description);
  draw();
}

function quiz(questions) {
  const form=element('form');
  const fields=questions.map(([question,choices],index)=>{
    const label=element('label',question);
    const select=element('select');
    select.id='answer-'+index;
    select.required=true;
    label.htmlFor=select.id;
    select.append(new Option('Choose an answer',''),...choices.map((choice,i)=>new Option(choice,i)));
    const explanation=element('p','','feedback');
    form.append(label,select,explanation);
    return [select,explanation];
  });
  const check=element('button','Check answers','run');
  const score=element('p','','feedback');
  score.setAttribute('role','status');
  form.append(check,score);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    let correct=0;
    fields.forEach(([select,explanation],index)=>{
      const match=Number(select.value)===questions[index][2];
      if (match) correct++;
      explanation.textContent=(match?'Correct. ':'Try again. ')+questions[index][3];
    });
    score.textContent=correct+' of '+fields.length+' correct.';
  });
  return form;
}

const managementAddress = '192.168.99.2';
const managementUrl = 'https://' + managementAddress;

function managementDiagram(kind = 'usb') {
  const cables = {
    usb: ['USB data cable', 'USB port', 'USB CONSOLE', '#75dcff'],
    serial: ['USB-to-RJ45 serial console', 'USB port', 'RJ45 CONSOLE', '#c295ff'],
    ethernet: ['Cat6 Ethernet patch cable', 'Ethernet adapter', 'Gi1/0/2 · VLAN 99', '#85f8bd']
  };
  const [name, left, right, color] = cables[kind];
  svg('Management laptop to switch using ' + name, `
    <text x="130" y="85" text-anchor="middle">Management laptop</text>
    <text x="528" y="85" text-anchor="middle">SW1 · front</text>
    <rect class="device" x="48" y="110" width="164" height="91" rx="6"/>
    <rect class="device" x="446" y="110" width="164" height="91" rx="6"/>
    <rect class="port" x="193" y="145" width="19" height="23" rx="3"/>
    <rect class="port" x="446" y="145" width="19" height="23" rx="3"/>
    <path class="cable plugging" pathLength="1" style="--cable:${color}" d="M212 156h234"/>
    <text class="small" x="329" y="140" text-anchor="middle">${name}</text>
    <text class="small" x="130" y="233" text-anchor="middle">${left}</text>
    <text class="small" x="528" y="233" text-anchor="middle">${right}</text>`, '0 0 660 280');
}

function managementVisual() {
  const note = element('p');
  note.setAttribute('role','status');
  const choices = [
    ['usb','Native USB console','Use the switch’s USB port labeled CONSOLE. The terminal app opens the serial device. The switch does not need an IP address for this.'],
    ['serial','RJ45 serial console','Use a compatible USB-to-RJ45 serial console cable. Match the switch’s console specifications. An ordinary Ethernet adapter cannot act as a serial console cable.'],
    ['ethernet','Ethernet browser path','Connect the laptop to Gi1/0/2 using a regular Ethernet patch cable. Use a USB Ethernet adapter if needed. Both management addresses belong to VLAN 99.']
  ];
  for (const [kind,label,message] of choices) {
    byId('visual-controls').append(action(label,()=>{
      managementDiagram(kind);
      note.textContent=message;
    }));
  }
  byId('visual-controls').append(note);
  note.textContent=choices[0][2];
  managementDiagram();
}

function managementCheck() {
  const panel=element('section','','management-check');
  const title=element('h3','Test from the management laptop');
  const network=element('form');
  const addressLabel=element('label','Laptop IPv4 address with prefix');
  const address=element('input');
  address.id='laptop-management-ip';
  address.required=true;
  address.placeholder='192.168.99.10/24';
  addressLabel.htmlFor=address.id;
  const ping=element('button','Ping '+managementAddress,'run');
  const status=element('p','','feedback');
  status.setAttribute('role','status');
  network.append(addressLabel,address,ping,status);
  const browser=element('form');
  browser.hidden=true;
  const urlLabel=element('label','Simulated browser address bar');
  const url=element('input');
  url.id='switch-url';
  url.required=true;
  url.placeholder=managementUrl;
  urlLabel.htmlFor=url.id;
  const browserStatus=element('p','','feedback');
  browserStatus.setAttribute('role','status');
  browser.append(urlLabel,url,element('button','Open switch dashboard','run'),browserStatus);
  const dashboard=element('dialog','','dashboard');
  dashboard.setAttribute('aria-label','Simulated SW1 management dashboard');
  const header=element('header');
  header.append(element('strong','SW1 · Switch dashboard'),action('Close',()=>dashboard.close()));
  const data=element('dl');
  for (const [label,value] of [
    ['Mode','Simulation'],['Management IP',managementAddress+'/24'],['Management VLAN','99'],
    ['VLAN interface','Vlan99 · Up / Up'],['Laptop port','Gi1/0/2 · Connected'],['Web service','HTTPS enabled']
  ]) data.append(element('dt',label),element('dd',value));
  dashboard.append(header,data);
  address.addEventListener('input',()=>{
    browser.hidden=true;
    status.textContent='';
  });
  network.addEventListener('submit',event=>{
    event.preventDefault();
    const match=/^192\.168\.99\.([1-9]\d{0,2})\/24$/.exec(address.value.trim());
    const host=match?Number(match[1]):0;
    const reachable=host>=1&&host<=254&&host!==1&&host!==2;
    browser.hidden=!reachable;
    browserStatus.textContent='';
    status.textContent=reachable
      ? 'Success. SW1 replied to the simulated ping. Now use HTTPS.'
      : 'No reply in this exercise. Use an available host on 192.168.99.0/24, such as 192.168.99.10/24. The .1 and .2 addresses are reserved.';
    if (reachable) url.focus();
  });
  browser.addEventListener('submit',event=>{
    event.preventDefault();
    if (browser.hidden) return;
    const entered=url.value.trim().replace(/\/$/,'');
    if (entered!==managementUrl) {
      browserStatus.textContent='Use '+managementUrl+'. Plain HTTP is disabled in this lab.';
      return;
    }
    browserStatus.textContent='Success. The simulated dashboard responded over HTTPS.';
    dashboard.showModal();
  });
  panel.append(title,network,browser,dashboard);
  return panel;
}

function terminal(lesson, onComplete) {
  const device=lesson.device||'SW1';
  let prompt=device+'>';
  let position=0;
  const panel=element('div','','terminal');
  const output=element('pre',prompt,'terminal-output');
  output.setAttribute('role','log');
  output.setAttribute('aria-label','Terminal transcript');
  const form=element('form');
  const label=element('label','Enter the next IOS command');
  label.htmlFor='command';
  const input=element('input');
  input.id='command'; input.autocomplete='off'; input.spellcheck=false; input.required=true;
  const run=element('button','Run','run');
  const row=element('div','','terminal-form');
  row.append(input,run);
  const hint=element('pre',lesson.cli[0][0],'feedback');
  hint.setAttribute('aria-live','polite');
  input.setAttribute('aria-describedby','command-hint');
  hint.id='command-hint';
  form.append(label,hint,row);
  const reference=element('details');
  reference.append(element('summary','Show all commands for this lesson'),element('pre',lesson.cli.map(([command])=>command).join('\n')));
  panel.append(output,form,reference);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const entered=input.value.trim().replace(/\s+/g,' ');
    if (!entered || position>=lesson.cli.length) return;
    const [expected,response]=lesson.cli[position];
    if (entered.toLowerCase()!==expected.toLowerCase()) {
      hint.textContent='Try this command at '+prompt+' '+expected;
      return;
    }
    const transcript=output.textContent+entered+'\n';
    if (response.endsWith('#')) {
      prompt=response;
      output.textContent=transcript+prompt;
    } else {
      output.textContent=transcript+(response?response+'\n':'')+prompt;
    }
    input.value='';
    position++;
    output.scrollTop=output.scrollHeight;
    hint.textContent=lesson.cli[position]?.[0]||'Complete. Review the terminal output before moving on.';
    input.disabled=run.disabled=position===lesson.cli.length;
    if (input.disabled && onComplete) onComplete();
  });
  return panel;
}

const navigation=networkCourse.map((lesson,index)=>{
  const button=action(lesson.name,()=>show(index,true));
  byId('lessons').append(button);
  return button;
});

function show(index,focus=false) {
  clearInterval(rackTimer); rackTimer=null;
  current=index;
  const lesson=networkCourse[index];
  navigation.forEach((button,offset)=>{
    if (offset===index) button.setAttribute('aria-current','step');
    else button.removeAttribute('aria-current');
  });
  byId('progress').textContent='Lesson '+(index+1)+' of '+networkCourse.length;
  byId('lesson-title').textContent=lesson.title;
  byId('summary').textContent=lesson.summary;
  byId('instructions').replaceChildren(...lesson.steps.map(step=>element('li',step)));
  byId('previous').disabled=index===0;
  byId('next').disabled=index===networkCourse.length-1;
  byId('next').textContent=networkCourse[index+1]?'Next: '+networkCourse[index+1].name:'Course complete';
  byId('canvas').replaceChildren();
  byId('visual-controls').replaceChildren();
  byId('visual-status').textContent='';
  const visualNames={rack:'Switch mounting',patch:'Cable path',subnet:'IPv4 address blocks',server:'Server and switch ports',boot:'Power-on and OS installation',ports:'Data port and VLAN',management:'Console and Ethernet connections'};
  byId('visual-title').textContent=visualNames[lesson.visual]||'Lab topology';
  if (['rack','patch','server','boot'].includes(lesson.visual)) physicalVisual(lesson.visual);
  else if (lesson.visual==='management') managementVisual();
  else if (lesson.visual==='ports') portPicture();
  else if (lesson.visual==='subnet') subnetVisual();
  else {
    networkDiagram();
    const description=element('p','Choose a traffic path to see where the packet goes.');
    description.setAttribute('role','status');
    byId('visual-controls').append(action('Send to local PC',()=>{
      networkDiagram('local');
      description.textContent='PC-A → SW1 → PC-B. Both PCs are in the same subnet and VLAN in this example.';
    }),action('Send to remote network',()=>{
      networkDiagram('remote');
      description.textContent='PC-A → SW1 → gateway R1 → remote network.';
    }),description);
  }
  const practice=byId('practice');
  practice.replaceChildren();
  if (lesson.skill) practice.append(element('p',lesson.skill,'skill'));
  if (lesson.sample) practice.append(element('pre',lesson.sample,'terminal'));
  if (lesson.cli) practice.append(terminal(lesson, lesson.visual==='management' ? () => practice.append(managementCheck()) : null));
  if (lesson.quiz) practice.append(quiz(lesson.quiz));
  if (focus) byId('lesson-title').focus();
}
byId('previous').addEventListener('click',()=>show(current-1,true));
byId('next').addEventListener('click',()=>show(current+1,true));
show(0);
