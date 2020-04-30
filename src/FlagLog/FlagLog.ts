import { IPlugin, IModLoaderAPI } from "modloader64_api/IModLoaderAPI";
import { IOOTCore, OotEvents } from "modloader64_api/OOT/OOTAPI";
import { InjectCore } from "modloader64_api/CoreInjection";
import bitwise from "bitwise";
import { UInt8 } from "bitwise/types";
import { EventHandler } from "modloader64_api/EventHandler";

class FlagLog implements IPlugin
{
    ModLoader!: IModLoaderAPI;
    pluginName?: string | undefined;
    @InjectCore()
    core!: IOOTCore;
    lastSceneFlags!: Buffer;
    lastEventFlags!: Buffer;
    lastItemFlags!: Buffer;
    lastInfTable!: Buffer;

    preinit(): void {}
    init(): void {}
    postinit(): void {}

    @EventHandler(OotEvents.ON_SAVE_LOADED)
    onSaveLoaded(event: OotEvents.ON_SAVE_LOADED) : void
    {
        this.lastSceneFlags = this.core.save.permSceneData;
        this.lastEventFlags = this.core.save.eventFlags;
        this.lastItemFlags = this.core.save.itemFlags;
        this.lastInfTable = this.core.save.infTable;
    }

    @EventHandler(OotEvents.ON_SCENE_CHANGE)
    onSceneChanged(event: OotEvents.ON_SCENE_CHANGE) : void
    {
        this.lastSceneFlags = this.core.save.permSceneData;
    }

    onTick(frame?: number | undefined): void
    {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNumberValid())
            return;

        if (this.lastSceneFlags === undefined)
            return;

        this.compareSceneFlags();
        this.compareEventFlags();
        this.compareItemFlags();
        this.compareInfTable();
    }

    compareSceneFlags() : void
    {
        if (this.core.helper.isLinkEnteringLoadingZone() || this.core.global.scene_framecount <= 20)
            return;

        this.saveLiveSceneFlags();

        var lastHash = this.ModLoader.utils.hashBuffer(this.lastSceneFlags);
        var currentHash = this.ModLoader.utils.hashBuffer(this.core.save.permSceneData);

        if(lastHash === currentHash)
            return;
        this.ModLoader.logger.info("Scene Flags Changed...");

        var oldFlags = this.lastSceneFlags;
        var newFlags = this.core.save.permSceneData;

        for(var i = 0; i < oldFlags.byteLength; i++)
        {
            if(oldFlags[i] === newFlags[i])
                continue;
            
            var oldByte = bitwise.byte.read(oldFlags[i] as UInt8);
            var newByte = bitwise.byte.read(newFlags[i] as UInt8);

            for(var j = 0; j < oldByte.length; j++)
            {
                if(oldByte[j] !== newByte[j])
                {
                    this.outputChange("SCENE", i, j, newByte[j]);
                }
            }
        }

        this.ModLoader.logger.info("Finished Scene Flag Changes.");
        newFlags.copy(this.lastSceneFlags);
    }

    compareEventFlags() : void
    {
        var lastHash = this.ModLoader.utils.hashBuffer(this.lastEventFlags);
        var currentHash = this.ModLoader.utils.hashBuffer(this.core.save.eventFlags);

        if(lastHash === currentHash)
            return;
        this.ModLoader.logger.info("Event Flags Changed...");

        var oldFlags = this.lastEventFlags;
        var newFlags = this.core.save.eventFlags;

        for(var i = 0; i < oldFlags.byteLength; i++)
        {
            if(oldFlags[i] === newFlags[i])
                continue;
            
            var oldByte = bitwise.byte.read(oldFlags[i] as UInt8);
            var newByte = bitwise.byte.read(newFlags[i] as UInt8);

            for(var j = 0; j < oldByte.length; j++)
            {
                if(oldByte[j] !== newByte[j])
                {
                    this.outputChange("EVENT", i, j, newByte[j]);
                }
            }
        }

        this.ModLoader.logger.info("Finished Event Flag Changes.");
        newFlags.copy(this.lastEventFlags);
    }

    compareItemFlags() : void
    {
        var lastHash = this.ModLoader.utils.hashBuffer(this.lastItemFlags);
        var currentHash = this.ModLoader.utils.hashBuffer(this.core.save.itemFlags);

        if(lastHash === currentHash)
            return;
        this.ModLoader.logger.info("Item Flags Changed...");

        var oldFlags = this.lastItemFlags;
        var newFlags = this.core.save.itemFlags;

        for(var i = 0; i < oldFlags.byteLength; i++)
        {
            if(oldFlags[i] === newFlags[i])
                continue;
            
            var oldByte = bitwise.byte.read(oldFlags[i] as UInt8);
            var newByte = bitwise.byte.read(newFlags[i] as UInt8);

            for(var j = 0; j < oldByte.length; j++)
            {
                if(oldByte[j] !== newByte[j])
                {
                    this.outputChange("ITEM", i, j, newByte[j]);
                }
            }
        }

        this.ModLoader.logger.info("Finished Item Flag Changes.");
        newFlags.copy(this.lastItemFlags);
    }

    compareInfTable() : void
    {
        var lastHash = this.ModLoader.utils.hashBuffer(this.lastInfTable);
        var currentHash = this.ModLoader.utils.hashBuffer(this.core.save.infTable);

        if(lastHash === currentHash)
            return;
        
        this.ModLoader.logger.info("Info Table Changed....");

        var oldFlags = this.lastInfTable;
        var newFlags = this.core.save.infTable;

        for(var i = 0; i < oldFlags.byteLength; i++)
        {
            if(oldFlags[i] === newFlags[i])
                continue;
            
            var oldByte = bitwise.byte.read(oldFlags[i] as UInt8);
            var newByte = bitwise.byte.read(newFlags[i] as UInt8);

            for(var j = 0; j < oldByte.length; j++)
            {
                if(oldByte[j] !== newByte[j])
                {
                    this.outputChange("INF", i, j, newByte[j]);
                }
            }
        }

        this.ModLoader.logger.info("Finished Info Table Changes.");
        newFlags.copy(this.lastInfTable);
    }

    outputChange(dataLoc: string, byte: number, bit: number, set: number)
    {
        this.ModLoader.logger.info(dataLoc + " [ 0x" + byte.toString(16) + " , " + bit.toString() + " ] : " + ((set) ? "SET" : "UNSET"));
    }

    saveLiveSceneFlags()
    {
        var currentSavedSceneData: Buffer = this.core.global.getSaveDataForCurrentScene();
        var liveSceneChests: Buffer = this.core.global.liveSceneData_chests;
        var liveSceneSwitch: Buffer = this.core.global.liveSceneData_switch;
        var liveSceneCollect: Buffer = this.core.global.liveSceneData_collectable;
        var liveSceneClear: Buffer = this.core.global.liveSceneData_clear;
        var liveSceneTemp: Buffer = this.core.global.liveSceneData_temp;

        var newData: Buffer = Buffer.alloc(0x1C);

        // Probably needs works?
        currentSavedSceneData.copy(newData);
        
        liveSceneChests.copy(newData, 0x0);
        liveSceneSwitch.copy(newData, 0x4);
        liveSceneCollect.copy(newData, 0x8);
        liveSceneClear.copy(newData, 0xC);
        liveSceneTemp.copy(newData, 0x10);

        var savedHash = this.ModLoader.utils.hashBuffer(currentSavedSceneData);
        var newHash = this.ModLoader.utils.hashBuffer(newData);

        if(savedHash !== newHash)
        {
            this.core.global.writeSaveDataForCurrentScene(newData);
            this.ModLoader.logger.info("Pushed Live Scene Flags to Save Context");
        }
    }
}

module.exports = FlagLog;