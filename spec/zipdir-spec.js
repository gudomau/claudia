/*global describe, it, expect, beforeEach, afterEach, require */
const shell = require('shelljs'),
	fs = require('fs'),
	os = require('os'),
	path = require('path'),
	tmppath = require('../src/util/tmppath'),
	trimSlash = require('../src/util/trimslash'),
	underTest = require('../src/tasks/zipdir');

describe('zipdir', () => {
	'use strict';
	let workingdir, zipfile, pwd;
	beforeEach(() => {
		workingdir = tmppath();
		shell.mkdir(workingdir);
		pwd = shell.pwd();
		zipfile = false;
	});
	afterEach(() => {
		shell.cd(pwd);
		shell.rm('-rf', workingdir);
		if (zipfile) {
			shell.rm('-rf', zipfile);
		}
	});
	it('rejects if the path does not exist', done => {
		const argpath = tmppath();
		underTest(argpath).then(done.fail, reason => {
			expect(reason).toEqual(argpath + ' does not exist');
			done();
		});
	});
	it('rejects if the path is not a dir', done => {
		const filePath = path.join(workingdir, 'root.txt');
		fs.writeFileSync(filePath, 'text1', 'utf8');
		underTest(filePath).then(done.fail, (reason) => {
			expect(reason).toEqual(filePath + ' is not a directory');
			done();
		});
	});
	it('zips up files and subfolders into a temporary path', done => {
		const original = path.join(workingdir, 'original');
		shell.mkdir(original);
		fs.writeFileSync(path.join(original, 'root.txt'), 'text1', 'utf8');
		shell.mkdir(path.join(original, 'subdir'));
		fs.writeFileSync(path.join(original, 'subdir', 'sub.txt'), 'text2', 'utf8');

		underTest(original).then(argpath => {
			const unpacked = path.join(workingdir, 'unpacked');

			zipfile = argpath;
			shell.mkdir(unpacked);
			shell.cd(unpacked);
			if (shell.exec('unzip ' + argpath).code !== 0) {
				done.fail('invalid archive');
			}

			expect(trimSlash(path.dirname(argpath))).toEqual(trimSlash(os.tmpdir()));
			expect(fs.readFileSync(path.join(unpacked, 'root.txt'), 'utf8')).toEqual('text1');
			expect(fs.readFileSync(path.join(unpacked, 'subdir', 'sub.txt'), 'utf8')).toEqual('text2');
		}).then(done, done.fail);
	});
	it('removes the original dir if successful', done => {
		const original = path.join(workingdir, 'original');

		shell.mkdir(original);
		fs.writeFileSync(path.join(original, 'root.txt'), 'text1', 'utf8');
		underTest(original).then(() => {
			expect(shell.test('-e', original)).toBeFalsy();
		}).then(done, done.fail);
	});
});

