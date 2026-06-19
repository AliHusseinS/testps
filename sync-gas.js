const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // 1. استخراج الـ Deployment ID (معرف النشر) تلقائياً من ملف index.html الرئيسي
  console.log('🔍 يتم قراءة ملف index.html لاستخراج معرف النشر (Deployment ID)...');
  const indexHtmlPath = path.join(__dirname, 'index.html');
  const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // تعبير نمطي للبحث عن المعرف في الـ API_URL
  const apiUrlMatch = indexHtmlContent.match(/const\s+API_URL\s*=\s*["']https:\/\/script\.google\.com\/macros\/s\/([A-Za-z0-9_-]+)\/exec["']/);
  const deploymentId = apiUrlMatch ? apiUrlMatch[1] : null;

  if (deploymentId) {
    console.log(`🎯 تم العثور على معرف النشر الحالي: ${deploymentId}`);
  } else {
    console.log('⚠️ لم يتم العثور على معرف النشر في API_URL، سيتم رفع الكود دون نشره تلقائياً.');
  }

  // 2. بناء الواجهة الأمامية باستخدام Vite
  console.log('\n📦 يتم الآن بناء الواجهة الأمامية (Vite build)...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. التأكد من وجود مجلد النشر gas-deploy
  const deployDir = path.join(__dirname, 'gas-deploy');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir);
  }

  // 4. نسخ ملف index.html المترجم إلى gas-deploy/Index.html
  console.log('📄 يتم نسخ ملف index.html إلى مجلد النشر...');
  fs.copyFileSync(
    path.join(__dirname, 'dist', 'index.html'),
    path.join(deployDir, 'Index.html')
  );

  // 5. نسخ ملف script.txt البرمجي إلى gas-deploy/Code.js
  console.log('⚙️ يتم نسخ كود الخلفية (script.txt) إلى مجلد النشر كـ Code.js...');
  fs.copyFileSync(
    path.join(__dirname, 'script.txt'),
    path.join(deployDir, 'Code.js')
  );

  // 6. إنشاء ملف الإعدادات الخاص بجوجل appsscript.json إذا لم يكن موجوداً
  const appsscriptJsonPath = path.join(deployDir, 'appsscript.json');
  if (!fs.existsSync(appsscriptJsonPath)) {
    const appsscriptConfig = {
      timeZone: 'Asia/Baghdad',
      dependencies: {},
      exceptionLogging: 'STACKDRIVER',
      runtimeVersion: 'V8',
      webapp: {
        access: 'ANYONE',
        executeAs: 'USER_DEPLOYING'
      }
    };
    fs.writeFileSync(appsscriptJsonPath, JSON.stringify(appsscriptConfig, null, 2));
    console.log('📝 تم إنشاء ملف الإعدادات appsscript.json.');
  }

  // 7. رفع الملفات إلى Google Apps Script باستخدام clasp
  console.log('\n🚀 يتم الآن مزامنة ورفع الأكواد تلقائياً إلى Google Apps Script...');
  execSync('npx clasp push --force', { stdio: 'inherit', cwd: deployDir });

  // 8. نشر الإصدار الجديد تلقائياً دون الحاجة للدخول للمتصفح
  if (deploymentId) {
    console.log('\n🌐 يتم الآن نشر الإصدار الجديد وتحديث الـ Web App تلقائياً...');
    execSync(`npx clasp deploy -i ${deploymentId} -d "Auto-deployed update"`, { stdio: 'inherit', cwd: deployDir });
    console.log('✅ تم نشر وتحديث الـ Web App بنجاح!');
  }

  // 9. الرفع التلقائي إلى GitHub
  console.log('\n🐙 يتم التحقق من التغييرات المحلية لرفعها إلى GitHub...');
  try {
    const gitStatus = execSync('git status --porcelain', { stdio: 'pipe' }).toString().trim();
    if (gitStatus) {
      console.log('⚙️ تم العثور على تعديلات جديدة، يتم الآن الرفع إلى GitHub...');
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Auto-update & deploy system"', { stdio: 'inherit' });
      execSync('git push -f origin Load', { stdio: 'inherit' });
      console.log('✅ تم رفع كافة الملفات والتعديلات إلى GitHub Pages بنجاح!');
    } else {
      console.log('✅ لا توجد أي تعديلات جديدة للرفع إلى GitHub.');
    }
  } catch (gitError) {
    console.warn('\n⚠️ تنبيه: لم يتم الرفع إلى GitHub لأن هذا المجلد المحلي ليس مستودع Git أو بسبب مشكلة في الإعدادات.');
    console.log('💡 إذا أردت تفعيل الرفع التلقائي لـ GitHub، تأكد من تشغيل أمر: git init وربط المجلد بـ GitHub.');
  }

  console.log('\n🎉 اكتملت العملية بالكامل بنجاح تام! الكود مرفوع ومنشور على جوجل، ومحدث على GitHub Pages.');

} catch (error) {
  console.error('\n❌ حدث خطأ أثناء المزامنة:', error.message);
  console.log('\n💡 تأكد من التالي:\n1. قمت بتشغيل أمر تسجيل الدخول: npx clasp login\n2. قمت بتفعيل Apps Script API في حساب جوجل الخاص بك.\n3. قمت بوضع الـ Script ID الصحيح في ملف gas-deploy/.clasp.json\n');
}
