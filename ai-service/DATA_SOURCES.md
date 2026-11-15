# Источники данных для обучения модели дефектов

Модель QazGost обучается на своих фото и на открытых наборах. Наборы с лицензией CC BY 4.0
разрешают использование в коммерческом продукте при указании источника — он указан здесь.

| Набор | Что в нём | Лицензия |
|---|---|---|
| [university-bswxt/crack-bphdr](https://universe.roboflow.com/university-bswxt/crack-bphdr) | трещины | Public Domain |
| [defect-detection-edbnh/concrete-merge-632p6](https://universe.roboflow.com/defect-detection-edbnh/concrete-merge-632p6) | трещины, сколы, арматура, высолы, коррозия | CC BY 4.0 |
| [defect-detection-0atjo/concrete-defect-detection-zuym8](https://universe.roboflow.com/defect-detection-0atjo/concrete-defect-detection-zuym8) | трещины, сколы, арматура, высолы, ржавчина | CC BY 4.0 |
| [rebar-exposure-and-spalling/aperi](https://universe.roboflow.com/rebar-exposure-and-spalling/aperi) | трещины, сколы, арматура, высолы | CC BY 4.0 |
| [new-workspace-yur70/concrete_defect](https://universe.roboflow.com/new-workspace-yur70/concrete_defect) | трещины, сколы, ржавчина арматуры, высолы | CC BY 4.0 |
| [brick-detection-in-a-brick-wall/masonry-hzess](https://universe.roboflow.com/brick-detection-in-a-brick-wall/masonry-hzess) (MCrack1300) | трещины по кирпичной кладке, в т.ч. ступенчатые | CC BY 4.0 |
| [student-from-uminho/crack-detection-brick](https://universe.roboflow.com/student-from-uminho/crack-detection-brick) | трещины по кирпичу | CC BY 4.0 |
| [bharati-vidhypeeth-college-of-engineering-pune/brick-crack-detection-2](https://universe.roboflow.com/bharati-vidhypeeth-college-of-engineering-pune/brick-crack-detection-2) | трещины по кирпичу | CC BY 4.0 |
| [buildscan/buildscandamagedetection](https://universe.roboflow.com/buildscan/buildscandamagedetection) | трещины стен | CC BY 4.0 |
| [assess-mortar-cracks-by-using-image-and-machine-learning/masonry-2-instance](https://universe.roboflow.com/assess-mortar-cracks-by-using-image-and-machine-learning/masonry-2-instance) | трещины по швам кладки | CC BY 4.0 |

Какие наборы реально скачались и какие классы из них взяты, записывается при каждом обучении
в `runs/qazgost_v3/REPORT.json` (поле `extra_datasets`). Из наборов по кладке берутся только трещины;
если набор недоступен или в нём нет подходящих классов, он пропускается.

Не используется: dacl10k — его лицензия CC BY-NC 4.0 запрещает коммерческое использование.

Свои фото: `dataset/own/images` + `dataset/own/labels` (разметка YOLO, классы по порядку:
crack, corrosion, spalling, efflorescence, exposed_rebar, stain).
