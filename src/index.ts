#!/usr/bin/env node
import { execa } from 'execa';
import { consola } from "consola";
import { Command } from "commander";
import * as p from '@clack/prompts';

const runCLI = () => {
  const program = new Command();

  program.name("nixfinder").description("find to nixpkgs").version("v1.0.0")

  program
  .command("find")
  .argument("<packagename>")
  .action(async(packagename) => {
    const spinner = p.spinner();
    spinner.start("検索中...");
    const result = await execa("nix", ["search", "nixpkgs", packagename, "--json"]);
    spinner.stop("検索完了！");
    const raw = JSON.parse(result.stdout);
    if (Object.keys(raw).length === 0) {
      consola.error(`"${packagename}"は見つかりませんでした`);
      return;
    }
    const packages = Object.entries(raw).map(([key, pkg]: [string, any]) => {
      const attrName = key.replace(/^legacyPackages\.[^.]+\./, "");
      return { attrName, description: pkg.description ?? "" };
    });
    const chosen = await p.select({
      message: "パッケージを選んでください",
      options: packages.map((pkg) => ({
        value: pkg.attrName,
        label: pkg.attrName,
        hint: pkg.description,
      })),
    });
    if (p.isCancel(chosen)) {
      consola.info("キャンセルしました");
      return;
    }
    await execa("nix", ["profile", "install", `nixpkgs#${chosen}`], { stdio: "inherit" });
  });

  program.parse();
}

runCLI();
