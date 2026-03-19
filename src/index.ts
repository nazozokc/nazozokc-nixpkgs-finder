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
    const result = await execa("nix", ["search", "nixpkgs", packagename, "--json"]);
    const raw = JSON.parse(result.stdout);

    if (Object.keys(raw).length === 0) {
      consola.error(`"${packagename}"は見つかりませんでした`);
    } else {
      const yes = await p.confirm({
        message: `nixpkgs#${packagename} をインストールしますか？`,
      });

      if (p.isCancel(yes) || !yes) {
        consola.info("キャンセルしました");
      };

      await execa("nix", ["profile", "install", `nixpkgs#${packagename}`], { stdio: "inherit" });
    };
  });
}
