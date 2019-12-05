const EXECUTED = 0;
const FRESH = 1;
const EXPIRED = 2;
const DELETED = 3;

alarmReg = {};

let audio = new Audio();
audio.src = 'elara.mp3';

regTimerJob = (doc) => {
	let now = new Date();
	let timeGap = new Date(doc.data.time) - now;
	if (timeGap > 0 && timeGap < Math.pow(2, 31)) {
		let timeout = setTimeout(() => {
			new window.Notification(doc.data.title, {
				title: doc.data.title,
				body: doc.data.title,
				tab: 'TAG',
				vibrate: [200, 100, 200, 100, 200],
				icon: 'clock.png',
				sound: 'elara.mp3'
			})
			audio.play();
			delete alarmReg[doc._id];
			doc.data.status = EXECUTED;
			utools.db.put(doc);
			flushTable(listAllJobs());
		}, timeGap);
		alarmReg[doc._id] = timeout;
	}
}

createAlarmJob = (text) => {
	let reg1 = /(?:(\d+)(Y))?(?:(\d+)(M))?(?:(\d+)(D))?(?:(\d+)(h))?(?:(\d+)(m))?(?:(\d+)(s)?)?\s+(.+)/;
	let reg2 = /(\d{4}-\d{1,2}-\d{1,2}\s\d+:\d+:\d+)\s(.*)/;

	let mtc1 = reg1.exec(text);

	var time, title;
	if (mtc1) {
		// let t1 = mtc1[1];
		// time = t1 * 1000 + new Date().getTime();
		// title = mtc1[2];
		time = new Date()
		for (let numInd = 1, flagInd = numInd + 1, end = mtc1.length - 1; numInd < end; numInd += 2, flagInd += 2) {
			let num = parseInt(mtc1[numInd])
			let flag = mtc1[flagInd]
			if(num) {
				switch (flag) {
					case 'Y':
						time.setFullYear(time.getFullYear() + num)
						break;
					case 'M':
						time.setMonth(time.getMonth() + num)
						break;
					case 'D':
						time.setDate(time.getDate() + num)
						break;
					case 'h':
						time.setHours(time.getHours() + num)
						break;
					case 'm':
						time.setMinutes(time.getMinutes() + num)
						break;
					case 's':
					default:
						time.setSeconds(time.getSeconds() + num)
						break;
				}
			}
		}
		title = mtc1[13];
	}

	let mtc2 = reg2.exec(text);
	if (mtc2) {
		title = mtc2[2];
		time = mtc2[1];
	}

	if(!mtc1 && !mtc2) {
		return
	}

	const id = 'alarm/' + (+new Date());
	utools.db.put({
		_id: id,
		data: {
			time, title,
			status: FRESH
		}
	});

	regTimerJob(getJob(id));

	flushTable(listAllJobs());
}

deleteAlarmJob = (id) => {
	let job = utools.db.get(id);
	// job.data.status = DELETED;
	// utools.db.put(job);
	let res = utools.db.remove(id);
	if (alarmReg[id]) {
		clearTimeout(alarmReg[id])
		delete alarmReg[id]
	} 
	flushTable(listAllJobs());
}

listAllJobs = () => {
	return utools.db.allDocs('alarm').sort((a, b) => {
		return new Date(b.data.time) - new Date(a.data.time) ;
	});
}

getJob = (id) => {
	return utools.db.get(id);
}

fitlerJobs = (keyWord) => {
	return utools.db.allDocs('alarm').filter(doc => {
		return doc.title.indexOf(keyWord) >= 0;
	})
}

flushTable = (docs) => {
	let html = '';
	let now = new Date();
	document.getElementById('table_body').innerHTML = html;
	docs.forEach(doc => {
		var expired = new Date(doc.data.time) - now < 0;
		if (expired && doc.data.status == FRESH) {
			doc.data.status = EXPIRED;
			utools.db.put(doc);
		}
		let comment = '';
		switch (doc.data.status) {
			case EXECUTED:
				comment = '已执行';
				break;
			case FRESH:
				comment = '待执行';
				break;
			case DELETED:
				comment = '已删除';
				break;
			case EXPIRED:
				comment = '已过期';
				break;
			default:
				comment = '未知状态';
				break;
		}
		html += `<tr><td>${dateFmt('yyyy-MM-dd hh:mm:ss', new Date(doc.data.time))}</td><td>${doc.data.title}</td><td><a href="javascript:void(0)" onclick="deleteAlarmJob('${doc._id}')" >删除</a> <span class="job-status-${doc.data.status}">${comment}</span></td></tr>`;
	});
	document.getElementById('table_body').innerHTML = html;
}

function dateFmt(fmt,date) { //author: meizz   
	var o = {   
		"M+" : date.getMonth()+1,                 //月份   
		"d+" : date.getDate(),                    //日   
		"h+" : date.getHours(),                   //小时   
		"m+" : date.getMinutes(),                 //分   
		"s+" : date.getSeconds(),                 //秒   
		"q+" : Math.floor((date.getMonth()+3)/3), //季度   
		"S"  : date.getMilliseconds()             //毫秒   
	};
	if(/(y+)/.test(fmt))
		fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
	for(var k in o)
		if(new RegExp("("+ k +")").test(fmt))
	fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
	return fmt;
} 