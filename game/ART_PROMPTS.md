# مرجع برومبتات Gemini — مستعمرة المدار

القواعد في مهارة `orbit-art-prompts`. كل صورة: خلفية بيضاء صلبة، بدون نصوص ولا أعلام ولا ظلال خلفية، منظور 3/4.
**للحفاظ على شكل الوحش نفسه:** أرفق صورته الحالية في Gemini مع البرومبت، واطلب «same creature».

## كيف تدخل الصور اللعبة
- الصور تُحفظ داخل `game/js/artdata.js` بمفاتيح `ART.اسم` (WebP base64) مع نسبة العرض للارتفاع في `ART.اسمR`.
- **إطارا المشي:** إذا وُجد `ART.<مفتاح>_w1` و`ART.<مفتاح>_w2` يستخدمهما `drawMon` في `world.js` تلقائياً بدل الأرجل المرسومة بالكود.

| الوحش | المفتاح | الوقفة | القدم اليمنى | القدم اليسرى |
|---|---|---|---|---|
| الذبابة الفضائية (المدار-1، صغير) | `pl0_small` | `pl0_small` | `pl0_small_w1` | `pl0_small_w2` |
| الطائر البلوري (الكريستال، صغير) | `pl3_small` | `pl3_small` | `pl3_small_w1` | `pl3_small_w2` |
| الشبح (السديم، صغير) | `pl5_small` | `pl5_small` | `pl5_small_w1` | `pl5_small_w2` |
| الشبح الكبير (السديم، كبير وحارس) | `pl5_big` | `pl5_big` | `pl5_big_w1` | `pl5_big_w2` |
| عقرب رمال المريخ (زعيم «صمود المدار» بدل السفينة الأم) | `bs_scorp` | — | — | — |
| ملكة الفضاء البنفسجية | `bs_queen` | — | — | — |
| طائرات اللاعب في «طيّار المدار»: الشبح، المدرّعة، النجمة | `pl_ghost`, `pl_tank`, `pl_star` | — | — | — |
| أعداء «طيّار المدار»: القاذفة، الغطّاسة، الطرّاد | `en_bomber`, `en_diver`, `en_cruiser` | — | — | — |

## أ) الوحوش الطائرة واقفة على أرجلها + المشي

### 1. الذبابة الفضائية — وقفة
```
3D game character asset, stylized Pixar-like 3D, sci-fi alien fly standing firmly on six articulated mechanical-organic legs, white and gold armor plates with subtle #00E5FF cyan glowing eyes and wing joints, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 2. الذبابة — القدم اليمنى للأمام
```
3D game character asset, stylized Pixar-like 3D, sci-fi alien fly walking forward with right-side legs stepping ahead and left-side legs pushing back, smooth leg stride, white and gold chitin with #00E5FF cyan accents, soft lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 3. الذبابة — القدم اليسرى للأمام
```
3D game character asset, stylized Pixar-like 3D, sci-fi alien fly walking forward with left-side legs stepping ahead and right-side legs pushing back, smooth opposing leg stride, white and gold chitin with #00E5FF cyan accents, soft lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 4. الطائر الفضائي — وقفة
```
3D game character asset, stylized Pixar-like 3D, alien bird creature standing upright on two strong clawed legs with folded stylized wings, sleek white and gold plumage with #00E5FF cyan crest and eye glow, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 5. الطائر — القدم اليمنى للأمام
```
3D game character asset, stylized Pixar-like 3D, alien bird creature walking forward with right leg stepped forward and left leg trailing behind, balanced stride, white and gold plumage with #00E5FF cyan accents, soft lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 6. الطائر — القدم اليسرى للأمام
```
3D game character asset, stylized Pixar-like 3D, alien bird creature walking forward with left leg stepped forward and right leg trailing behind, balanced stride, white and gold plumage with #00E5FF cyan accents, soft lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 7. الشبح الفضائي — وقفة
```
3D game character asset, stylized Pixar-like 3D, sci-fi wraith ghost creature standing on two spectral energy legs with a flowing hooded cloak, white and gold trim with glowing #00E5FF cyan core and eyes, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 8. الشبح — القدم اليمنى للأمام
```
3D game character asset, stylized Pixar-like 3D, sci-fi wraith ghost creature walking forward with right spectral leg stepping ahead and left leg trailing, white and gold trim with #00E5FF cyan glow, soft lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 9. الشبح — القدم اليسرى للأمام
```
3D game character asset, stylized Pixar-like 3D, sci-fi wraith ghost creature walking forward with left spectral leg stepping ahead and right leg trailing, white and gold trim with #00E5FF cyan glow, soft lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```

## ب) الزعماء والأعداء

### 10. عقرب رمال المريخ (بدل السفينة الأم في «صمود المدار»)
```
3D game boss asset, stylized Pixar-like 3D, giant Mars sand scorpion with segmented white and gold armored shell, heavy claws, curved tail stinger, and #00E5FF cyan glowing sensors, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 11. ملكة الفضاء البنفسجية
```
3D game boss asset, stylized Pixar-like 3D, regal alien space queen with ornate white and gold crown-like carapace, flowing royal silhouette, and #00E5FF cyan energy accents, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 12. طائرات «طيّار المدار» (الشبح، المدرّعة، النجمة) — وهي طائرات اللاعب
اطلب كل واحدة في صورة منفصلة، بتبديل الجملة بين القوسين:
```
3D game player spaceship asset, stylized Pixar-like 3D, [a sleek stealth ghost interceptor | a heavy armored gunship | a sharp star-shaped drone], top-down view, white and gold hull with #00E5FF cyan thrusters, soft studio lighting, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```

### 13. أعداء «طيّار المدار» (القاذفة، الغطّاسة، الطرّاد)
```
3D game enemy asset, stylized Pixar-like 3D, hostile alien [heavy bomber | fast diving fighter | large armored cruiser], top-down view, dark purple and red hull with glowing magenta engines, soft studio lighting, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```

## ج) بقية زعماء «صمود المدار» والحرّاس
المفاتيح المقترحة جديدة؛ تُربط بالكود عند وصول الصور (حالياً تُرسم الزعماء بصور مؤقتة بفلاتر ألوان).

| الزعيم | المفتاح المقترح |
|---|---|
| عملاق الصخور القمرية | `bs_golem` |
| تنين الكريستال الجليدي | `bs_dragon` |
| عملاق الحمم والنار | `bs_titan` |
| دودة الفضاء آكلة الكويكبات | `bs_worm` |
| ملك الحشرات | `bs_bugking` |
| شبح الضباب | `bs_mist` |

### 14. عملاق الصخور القمرية
```
3D game boss asset, stylized Pixar-like 3D, massive lunar rock golem with smooth white and gold armored plates, glowing #00E5FF cyan fissures and eyes, heavy rounded silhouette, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 15. تنين الكريستال الجليدي
```
3D game boss asset, stylized Pixar-like 3D, icy crystal dragon with sleek white and gold scale ridges and translucent #00E5FF cyan crystal spikes, poised dynamic stance, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 16. عملاق الحمم والنار
```
3D game boss asset, stylized Pixar-like 3D, colossal magma and fire titan with white and gold obsidian armor plating, glowing molten gold cracks and #00E5FF cyan core highlights, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 17. دودة الفضاء آكلة الكويكبات
```
3D game boss asset, stylized Pixar-like 3D, giant asteroid-eating space worm with segmented white and gold armored rings and #00E5FF cyan glowing mandibles, coiled 3/4 stance, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 18. ملك الحشرات
```
3D game boss asset, stylized Pixar-like 3D, regal alien insect king with white and gold carapace armor, twin horn-like antennae, and #00E5FF cyan glowing eyes, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 19. شبح الضباب
```
3D game boss asset, stylized Pixar-like 3D, towering mist wraith boss with layered white and gold spectral armor fragments and glowing #00E5FF cyan energy core, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```

## د) رائد الفضاء والروبوت المرافق
| الشخصية | المفتاح |
|---|---|
| رائد الفضاء الصغير | `astro` (موجود؛ الصورة الجديدة تستبدله بعد موافقتك) |
| الروبوت الطائر المرافق | `bot` (مقترح جديد) |

### 20. رائد الفضاء الصغير
```
3D game character asset, stylized Pixar-like 3D, cute chibi astronaut in a rounded white and gold spacesuit with a clear visor and glowing #00E5FF cyan trim lights, standing firmly in a ready pose, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
### 21. الروبوت الطائر المرافق
```
3D game character asset, stylized Pixar-like 3D, compact floating sci-fi companion drone with a smooth white and gold shell and bright #00E5FF cyan glowing eyes, soft studio lighting, 3/4 isometric view, isolated on a solid pure white background, no text, no flags, no distracting background shadows.
```
