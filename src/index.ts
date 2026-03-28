#!/usr/bin/env node
import { execa } from 'execa';
import { consola } from "consola";
import { Command } from "commander";
import * as p from '@clack/prompts';

interface Package {
  attrName: string;
  description: string;
}

interface NixSearchResult {
  description?: string;
  [key: string]: unknown;
}

const runCLI = (): void => {
  const program = new Command();

  program.name("nixfinder").description("find to nixpkgs").version("v1.0.0")

  program
  .command("find")
  .argument("<packagename>")
  .action(async(packagename) => {
    const spinner = p.spinner();
    spinner.start("検索中...");
    let result;
    try {
      result = await execa("nix", ["search", "nixpkgs", packagename, "--json"]);
    } catch (error) {
      spinner.stop();
      consola.error(`検索中にエラーが発生しました: ${error}`);
      return;
    }
    spinner.stop("検索完了！");
    const raw = JSON.parse(result.stdout) as Record<string, NixSearchResult>;
    if (Object.keys(raw).length === 0) {
      consola.error(`"${packagename}"は見つかりませんでした`);
      return;
    }
    const packages: Package[] = Object.entries(raw).map(([key, pkg]) => {
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
