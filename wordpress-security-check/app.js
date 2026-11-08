const LANG=document.documentElement.lang==="ja"?"ja":"en";
const $=id=>document.getElementById(id);
const preset=JSON.parse($("wpc").dataset.preset||"{}");
const API=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?"http://localhost:8799":preset.api;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const T={
en:{url:"Site URL",go:"Check site",consent:"I own or manage this site, or have permission to check it.",needConsent:"Please confirm you may check this site.",needUrl:"Enter a site address, such as example.com.",
 busy:"Checking… this takes 5–20 seconds.",siteLabel:"Results for",notWp:"This doesn’t look like a WordPress site. Only the general checks were run.",
 lv:{danger:"Fix now",warn:"Improve",ok:"OK",info:"Unknown"},sum:(d,w,o)=>`${d} to fix now · ${w} to improve · ${o} OK`,
 compH:"Plugins and themes found on the home page",th:["Name","Type","Version on site","Latest","Status"],plugin:"Plugin",theme:"Theme",
 st:{outdated:"Update available",abandoned:"Not updated for 2+ years",closed:"Removed from wordpress.org",ok:"Up to date",unknown:"Not in the wordpress.org directory",unknown_version:"Version hidden"},
 compNote:"Only components the home page loads can be seen from outside. Plugins used only on other pages or in the admin are not listed. Versions read from asset URLs are estimates.",
 truncated:"Only the first 30 plugins were checked.",
 limits:"This is a passive check of public pages. It can’t see inside the admin, the server or the database, so a clean result doesn’t prove the site is safe.",
 err:{bad_url:"That address can’t be checked. Enter a public site, such as example.com.",rate_limited:"Too many checks in a short time. Please wait a minute and try again.",unreachable:"The site didn’t respond. Check the address and try again.",http_error:s=>`The site returned an error (HTTP ${s}).`,network:"Couldn’t reach the checker. Please try again later."},
 ctaH:"Get alerted when this site needs attention",ctaBody:"We’re building a monitor that runs these checks every day and emails you when a plugin needs updating, a certificate is about to expire or a file appears that shouldn’t. Leave your email to get early access.",
 email:"you@example.com",join:"Notify me",joined:"Thanks. We’ll email you when it’s ready.",badEmail:"Please enter a valid email address.",
 c:{
  https:["HTTPS","The site is served over HTTPS.","The site isn’t served over HTTPS, so logins and form data can be intercepted. Get a free certificate (most hosts offer Let’s Encrypt) and force HTTPS."],
  http_redirect:["HTTP to HTTPS redirect","http:// requests are redirected to https://.","http:// isn’t redirected to https://. Visitors who type the address may end up on the insecure version. Add a redirect at the server or CDN."],
  hsts:["HSTS header","Browsers are told to always use HTTPS.","No Strict-Transport-Security header. Adding it stops browsers from falling back to plain HTTP."],
  nosniff:["X-Content-Type-Options","Set to nosniff.","Missing X-Content-Type-Options: nosniff. It stops browsers guessing file types, which blocks some attacks via uploads."],
  clickjacking:["Clickjacking protection","Other sites can’t embed your pages in a frame.","Neither X-Frame-Options nor CSP frame-ancestors is set, so other sites can embed your pages to trick visitors into clicking."],
  php:["PHP version",c=>`PHP ${c.version} (shown in the X-Powered-By header).`,c=>c.eol?`PHP ${c.version} security support ${c.level==="danger"?"ended":"ends"} on ${c.eol}. ${c.level==="danger"?"It no longer gets security fixes. Upgrade PHP.":"Plan the upgrade."} The server also announces its PHP version; hide it with expose_php = Off.`:`PHP ${c.version} no longer gets security fixes. Upgrade PHP.`],
  generator:["Version shown in page source","The WordPress version isn’t printed in the HTML.","The WordPress version is printed in a generator meta tag, which helps attackers pick exploits. Remove it with a security plugin or remove_action('wp_head','wp_generator')."],
  core:["WordPress version",c=>`WordPress ${c.version} is the latest release.`,c=>c.level==="warn"?`WordPress ${c.version} still gets security fixes, but the current release is ${c.latest}. Plan a major update.`:`WordPress ${c.version} has known security issues. Update to ${c.latest} (back up first).`,"The WordPress version is hidden, so it couldn’t be checked from outside."],
  readme:["readme.html","readme.html isn’t public.","/readme.html is public and can reveal the WordPress version. Delete it or block access."],
  xmlrpc:["XML-RPC","xmlrpc.php isn’t answering.","/xmlrpc.php is enabled. It is a common target for password-guessing and spam. If you don’t use the mobile app or Jetpack, block it."],
  users_api:["User list in REST API","Usernames aren’t listed publicly.","/wp-json/wp/v2/users lists login names, which makes password guessing easier. Restrict the endpoint with a security plugin."],
  uploads_listing:["Uploads folder listing","/wp-content/uploads/ isn’t browsable.","/wp-content/uploads/ shows a file list, so anyone can browse every upload. Turn off directory listing (Options -Indexes)."],
  debug_log:["debug.log","No public debug log found.","/wp-content/debug.log is public. Logs can contain file paths, queries and personal data. Delete it and turn off WP_DEBUG_LOG on the live site."]
 }},
ja:{url:"サイトのURL",go:"チェックする",consent:"自分が管理するサイト、またはチェックの許可を得たサイトです。",needConsent:"チェックしてよいサイトか確認のうえ、チェックを入れてください。",needUrl:"example.com のようにサイトのアドレスを入力してください。",
 busy:"チェック中です（5〜20秒ほどかかります）…",siteLabel:"チェック結果",notWp:"WordPressのサイトではないようです。共通の項目だけをチェックしました。",
 lv:{danger:"要対応",warn:"改善推奨",ok:"OK",info:"不明"},sum:(d,w,o)=>`要対応 ${d}件・改善推奨 ${w}件・OK ${o}件`,
 compH:"トップページで見つかったプラグイン・テーマ",th:["名前","種類","サイトのバージョン","最新","状態"],plugin:"プラグイン",theme:"テーマ",
 st:{outdated:"更新があります",abandoned:"2年以上更新なし",closed:"公式ディレクトリから削除",ok:"最新",unknown:"公式ディレクトリにない",unknown_version:"バージョン非公開"},
 compNote:"外から見えるのはトップページで読み込まれているものだけです。他のページや管理画面だけで使うプラグインは表示されません。読み込みURLから読み取ったバージョンは推定です。",
 truncated:"プラグインは最初の30件のみチェックしました。",
 limits:"公開ページだけを見る簡易チェックです。管理画面・サーバー・データベースの中は確認できないため、問題が出なくても安全とは限りません。",
 err:{bad_url:"このアドレスはチェックできません。example.com のような公開サイトを入力してください。",rate_limited:"短時間にチェックしすぎです。1分ほど待ってからお試しください。",unreachable:"サイトから応答がありません。アドレスを確認してもう一度お試しください。",http_error:s=>`サイトがエラーを返しました（HTTP ${s}）。`,network:"チェックサーバーに接続できませんでした。時間をおいてお試しください。"},
 ctaH:"このサイトに問題が出たら通知を受け取る",ctaBody:"このチェックを毎日自動で行い、プラグインの更新・SSL証明書の期限切れ・あってはならないファイルの公開などをメールでお知らせするサービスを準備中です。メールアドレスを登録すると、先行利用のご案内をお送りします。",
 email:"you@example.com",join:"案内を受け取る",joined:"登録しました。準備ができたらメールでお知らせします。",badEmail:"正しいメールアドレスを入力してください。",
 c:{
  https:["HTTPS（SSL）","HTTPSで配信されています。","HTTPSで配信されていないため、ログイン情報やフォームの内容を盗み見られるおそれがあります。無料のSSL証明書（多くのサーバーでLet’s Encryptが使えます）を設定し、HTTPSに統一してください。"],
  http_redirect:["HTTPからHTTPSへの転送","http:// のアクセスは https:// に転送されます。","http:// が https:// に転送されていません。アドレスを手入力した人が暗号化されていないページを見ることになります。サーバーかCDNで転送を設定してください。"],
  hsts:["HSTSヘッダー","常にHTTPSを使うようブラウザに指示しています。","Strict-Transport-Security ヘッダーがありません。設定すると、ブラウザが暗号化なしのHTTPに戻るのを防げます。"],
  nosniff:["X-Content-Type-Options","nosniff が設定されています。","X-Content-Type-Options: nosniff がありません。ブラウザによるファイル形式の推測を止め、アップロード経由の攻撃の一部を防げます。"],
  clickjacking:["クリックジャッキング対策","他サイトからフレームで埋め込めません。","X-Frame-Options も CSP の frame-ancestors も設定されていません。他サイトにページを埋め込まれ、訪問者を誤ってクリックさせる攻撃に使われるおそれがあります。"],
  php:["PHPのバージョン",c=>`PHP ${c.version}（X-Powered-By ヘッダーで表示）。`,c=>c.eol?`PHP ${c.version} のセキュリティサポートは ${c.eol} に${c.level==="danger"?"終了しました。セキュリティ修正が提供されないため、PHPを更新してください。":"終了します。更新の計画を立ててください。"}また、PHPのバージョンが外部に表示されています。expose_php = Off で隠せます。`:`PHP ${c.version} はセキュリティ修正が提供されていません。PHPを更新してください。`],
  generator:["ページ内のバージョン表示","HTMLにWordPressのバージョンが出ていません。","generator メタタグにWordPressのバージョンが出ており、攻撃者が狙う脆弱性を絞り込む手がかりになります。セキュリティプラグインや remove_action('wp_head','wp_generator') で消せます。"],
  core:["WordPress本体のバージョン",c=>`WordPress ${c.version} は最新版です。`,c=>c.level==="warn"?`WordPress ${c.version} はセキュリティ修正の対象ですが、最新版は ${c.latest} です。メジャー更新を計画してください。`:`WordPress ${c.version} には既知の脆弱性があります。バックアップのうえ ${c.latest} に更新してください。`,"WordPressのバージョンが隠されているため、外部からは確認できませんでした。"],
  readme:["readme.html","readme.html は公開されていません。","/readme.html が公開されており、WordPressのバージョンが分かることがあります。削除するかアクセスを禁止してください。"],
  xmlrpc:["XML-RPC","xmlrpc.php は応答しません。","/xmlrpc.php が有効です。パスワード総当たりやスパム投稿によく狙われます。スマホアプリやJetpackを使っていなければブロックしてください。"],
  users_api:["REST APIのユーザー一覧","ユーザー名は公開されていません。","/wp-json/wp/v2/users でログイン名が見えるため、パスワード総当たりが容易になります。セキュリティプラグインなどで制限してください。"],
  uploads_listing:["アップロードフォルダの一覧表示","/wp-content/uploads/ は一覧表示されません。","/wp-content/uploads/ でファイル一覧が表示され、誰でもすべてのアップロードを見られます。ディレクトリ一覧を無効にしてください（Options -Indexes）。"],
  debug_log:["debug.log","公開されたデバッグログはありません。","/wp-content/debug.log が公開されています。ファイルの場所やSQL、個人情報が含まれることがあります。削除し、本番では WP_DEBUG_LOG をオフにしてください。"]
 }}
}[LANG];
const ORDER={danger:0,warn:1,info:2,ok:3};
const say=(t,err)=>{$("status").textContent=t||"";$("status").className="wpc-status"+(err?" err":"")};
$("l-url").textContent=T.url;$("go").textContent=T.go;$("l-consent").textContent=T.consent;
$("r-site-label").textContent=T.siteLabel;$("c-h").textContent=T.ctaH;$("c-body").textContent=T.ctaBody;$("email").placeholder=T.email;$("c-btn").textContent=T.join;
$("url").value=new URLSearchParams(location.search).get("url")||PK.get("wpc:url","");
$("consent").checked=PK.get("wpc:consent",false);
let lastSite="";

async function post(path,body){
  const r=await fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  return {status:r.status,data:await r.json().catch(()=>({}))};
}
function text(c){
  const m=T.c[c.id];if(!m)return["",""];
  const pick=c.level==="ok"?m[1]:c.level==="info"?(m[3]||m[2]):m[2];
  return[m[0],typeof pick==="function"?pick(c):pick];
}
function render(d){
  lastSite=d.site;$("r-site").textContent=d.site;
  const checks=d.checks.slice().sort((a,b)=>ORDER[a.level]-ORDER[b.level]);
  const n=l=>checks.filter(c=>c.level===l).length;
  $("r-sum").innerHTML=["danger","warn","ok"].map(l=>`<span class="tag ${l}">${T.lv[l]} ${n(l)}</span>`).join("");
  $("r-list").innerHTML=(d.isWordPress?"":`<li><span class="tag">i</span><strong>${esc(T.notWp)}</strong></li>`)+checks.map(c=>{const[t,b]=text(c);return`<li><span class="tag ${c.level}">${T.lv[c.level]}</span><strong>${esc(t)}</strong><p>${esc(b)}</p></li>`}).join("");
  const comps=[...d.plugins.map(p=>({...p,kind:T.plugin})),...d.themes.map(p=>({...p,kind:T.theme}))];
  $("r-comp").hidden=!comps.length;
  if(comps.length){
    const lv={outdated:"warn",abandoned:"warn",closed:"danger",ok:"ok"};
    $("r-comp-h").textContent=T.compH;$("r-comp-th").innerHTML=T.th.map(h=>`<th>${esc(h)}</th>`).join("");
    comps.sort((a,b)=>ORDER[lv[a.status]||"info"]-ORDER[lv[b.status]||"info"]);
    $("r-comp-body").innerHTML=comps.map(p=>`<tr><td>${esc(p.name||p.slug)}</td><td>${esc(p.kind)}</td><td class="num">${esc(p.version||"—")}</td><td class="num">${esc(p.latest||"—")}</td><td><span class="tag ${lv[p.status]||""}">${esc(T.st[p.status]||p.status)}</span></td></tr>`).join("");
    $("r-comp-note").textContent=T.compNote+(d.pluginsTruncated?" "+T.truncated:"");
  }
  $("r-limits").textContent=T.limits;
  $("result").hidden=false;$("cta").hidden=false;
}
$("form").addEventListener("submit",async e=>{
  e.preventDefault();
  const url=$("url").value.trim();
  if(!url)return say(T.needUrl,true);
  if(!$("consent").checked)return say(T.needConsent,true);
  PK.set("wpc:url",url);PK.set("wpc:consent",true);
  $("go").disabled=true;say(T.busy);
  try{
    const {data}=await post("/scan",{url});
    if(data.error){const m=T.err[data.error]||T.err.unreachable;say(typeof m==="function"?m(data.status):m,true)}
    else{say("");render(data);$("result").scrollIntoView({behavior:"smooth",block:"start"})}
  }catch(err){say(T.err.network,true)}
  $("go").disabled=false;
});
$("wait").addEventListener("submit",async e=>{
  e.preventDefault();
  const email=$("email").value.trim(),st=$("c-status");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){st.textContent=T.badEmail;return}
  $("c-btn").disabled=true;
  try{
    const {data}=await post("/waitlist",{email,url:lastSite,lang:LANG});
    st.textContent=data.ok?T.joined:data.error==="rate_limited"?T.err.rate_limited:T.badEmail;
    if(data.ok)$("wait").hidden=true;
  }catch(err){st.textContent=T.err.network}
  $("c-btn").disabled=false;
});
