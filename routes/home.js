const { Router } = require("express");
const passport = require("passport");
const { google } = require("googleapis");
const KEYS = require("../configs/keys");

const vision = require("@google-cloud/vision");
const router = Router();

router.get("/", function (req, res) {
    res.redirect("/dashboard");
});

router.get("/dashboard", function (req, res) {
	// if not user
	if (typeof req.user == "undefined") res.redirect("/auth/login/google");
	else {
		let parseData = {
			title: "DASHBOARD",
			googleid: req.user._id,
			name: req.user.name,
			avatar: req.user.pic_url,
			email: req.user.email,
		};

		// if redirect with google drive response
		if (req.query.file !== undefined) {
			// successfully upload
			if (req.query.file == "upload") parseData.file = "uploaded";
			else if (req.query.file == "notupload") parseData.file = "notuploaded";
		}

		res.render("dashboard.html", parseData);
	}
});

router.post("/upload", function (req, res) {
	// not auth
	if (!req.user) res.redirect("/auth/login/google");
	else {
		// auth user

		// config google drive with client token
		const oauth2Client = new google.auth.OAuth2();
		oauth2Client.setCredentials({
			access_token: req.user.accessToken,
		});

		const drive = google.drive({
			version: "v3",
			auth: oauth2Client,
		});
		const client = new vision.ImageAnnotatorClient({
			keyFilename: "./apikey.json",
		});
		//move file to google drive

		let { name: filename, mimetype, data } = req.files.file_upload;

		var text = "";
		client
			.textDetection(Buffer.from(data))
			.then((results) => {
				const result = results[0].textAnnotations.slice(1);
				result.forEach((label) => (text += label.description + "|" ));
				console.log(text);

				const REGEX_CHINESE =
					/[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;
				const hasJapanese = (str) => REGEX_CHINESE.test(str);

				const seperateWords = (str) => {
					let newStr = str.split("|");
					let chiWords = newStr.filter((string) => REGEX_CHINESE.test(string)); //All chinnese words
					let engWords = newStr.filter((string) => !REGEX_CHINESE.test(string)); //All english words
					let arrayOfDiffWords = [chiWords, engWords];
					return arrayOfDiffWords;
				};
				console.log(seperateWords(text)); //test
			})

			.catch((err) => {
				console.error("ERROR:", err);
			});

		const driveResponse = drive.files.create({
			requestBody: {
				name: filename,
				mimeType: mimetype,
			},
			media: {
				mimeType: mimetype,
				body: Buffer.from(data).toString(),
			},
		});

		driveResponse
			.then((data) => {
				console.log(data);
				if (data.status == 200)
					res.redirect("/dashboard?file=upload"); // success
				else res.redirect("/dashboard?file=notupload"); // unsuccess
			})
			.catch((err) => {
				throw new Error(err);
			});
	}
});

module.exports = router;
