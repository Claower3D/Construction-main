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

Какие наборы реально скачались и какие классы из них взяты, записывается при каждом обучении
в `runs/qazgost_v2/REPORT.json` (поле `extra_datasets`).

Не используется: dacl10k — его лицензия CC BY-NC 4.0 запрещает коммерческое использование.

Свои фото: `dataset/own/images` + `dataset/own/labels` (разметка YOLO, классы по порядку:
crack, corrosion, spalling, efflorescence, exposed_rebar, stain).
